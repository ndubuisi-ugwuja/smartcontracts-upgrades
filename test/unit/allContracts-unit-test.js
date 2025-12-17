const { expect } = require("chai");
const { ethers, network } = require("hardhat");
require("dotenv").config();

const developmentChains = ["hardhat", "localhost"];

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Upgradeable Contracts - Full Test Suite", function () {
          let owner, addr1, addr2;
          let proxyAddress, proxyAdminAddress;
          let proxy, proxyAdmin;
          const EIP1967_ADMIN_SLOT = process.env.EIP1967ADMINSLOT;

          beforeEach(async function () {
              [owner, addr1, addr2] = await ethers.getSigners();
          });

          describe("V1 Deployment and Functionality", function () {
              beforeEach(async function () {
                  // Deploy implementation V1
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementation = await UpgradeableContract.deploy();
                  await implementation.waitForDeployment();

                  // Deploy TransparentUpgradeableProxy
                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementation.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  // Get ProxyAdmin address from storage
                  const EIP1967_ADMIN_SLOT = process.env.EIP1967ADMINSLOT;
                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  // Connect to proxy as V1
                  proxy = await ethers.getContractAt("UpgradeableContract", proxyAddress);

                  // Connect to ProxyAdmin
                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );
              });

              it("Should deploy with correct initial state", async function () {
                  expect(await proxy.version()).to.equal(1);
                  expect(await proxy.retrieve()).to.equal(0);
              });

              it("Should store and retrieve values correctly", async function () {
                  await proxy.store(42);
                  expect(await proxy.retrieve()).to.equal(42);
              });

              it("Should emit ValueChanged event on store", async function () {
                  await expect(proxy.store(100)).to.emit(proxy, "ValueChanged").withArgs(100);
              });

              it("Should allow multiple store operations", async function () {
                  await proxy.store(10);
                  expect(await proxy.retrieve()).to.equal(10);

                  await proxy.store(20);
                  expect(await proxy.retrieve()).to.equal(20);

                  await proxy.store(30);
                  expect(await proxy.retrieve()).to.equal(30);
              });

              it("Should handle zero value", async function () {
                  await proxy.store(100);
                  await proxy.store(0);
                  expect(await proxy.retrieve()).to.equal(0);
              });

              it("Should handle large numbers", async function () {
                  const largeNumber = ethers.parseEther("1000000");
                  await proxy.store(largeNumber);
                  expect(await proxy.retrieve()).to.equal(largeNumber);
              });

              it("Should work with different addresses", async function () {
                  await proxy.connect(addr1).store(111);
                  expect(await proxy.retrieve()).to.equal(111);

                  await proxy.connect(addr2).store(222);
                  expect(await proxy.retrieve()).to.equal(222);
              });
          });

          describe("V1 to V2 Upgrade", function () {
              beforeEach(async function () {
                  // Deploy V1
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementationV1 = await UpgradeableContract.deploy();
                  await implementationV1.waitForDeployment();

                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementationV1.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  // Get ProxyAdmin
                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );

                  // Store value in V1
                  proxy = await ethers.getContractAt("UpgradeableContract", proxyAddress);
                  await proxy.store(50);
              });

              it("Should upgrade to V2 successfully", async function () {
                  // Deploy V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  // Upgrade
                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  // Connect as V2
                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);

                  expect(await proxyV2.version()).to.equal(2);
              });

              it("Should preserve storage after upgrade to V2", async function () {
                  // Deploy and upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);

                  // Check value is preserved
                  expect(await proxyV2.retrieve()).to.equal(50);
              });

              it("Should have working increment function in V2", async function () {
                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);

                  // Value was 50, increment adds 2
                  await proxyV2.increment();
                  expect(await proxyV2.retrieve()).to.equal(52);
              });

              it("Should emit ValueChanged on increment in V2", async function () {
                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);

                  await expect(proxyV2.increment()).to.emit(proxyV2, "ValueChanged").withArgs(52);
              });

              it("Should maintain all V1 functions in V2", async function () {
                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);

                  // Test store and retrieve still work
                  await proxyV2.store(100);
                  expect(await proxyV2.retrieve()).to.equal(100);
              });

              it("Should keep same proxy address after upgrade", async function () {
                  const addressBeforeUpgrade = proxyAddress;

                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  expect(proxyAddress).to.equal(addressBeforeUpgrade);
              });
          });

          describe("V2 to V3 Upgrade", function () {
              beforeEach(async function () {
                  // Deploy V1
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementationV1 = await UpgradeableContract.deploy();
                  await implementationV1.waitForDeployment();

                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementationV1.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  // Get ProxyAdmin
                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );

                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  // Store value in V2
                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);
                  await proxyV2.store(100);
              });

              it("Should upgrade from V2 to V3 successfully", async function () {
                  // Deploy V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  // Upgrade to V3
                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  expect(await proxyV3.version()).to.equal(3);
              });

              it("Should preserve storage after upgrade to V3, store, retrieve values correctly", async function () {
                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  expect(await proxyV3.retrieve()).to.equal(100);

                  await proxyV3.store(42);
                  expect(await proxyV3.retrieve()).to.equal(42);

                  await expect(proxyV3.store(100)).to.emit(proxyV3, "ValueChanged").withArgs(100);
              });

              it("Should have working addToValue function in V3", async function () {
                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  // Value is 100, addToValue adds 3
                  await proxyV3.addToValue();
                  expect(await proxyV3.retrieve()).to.equal(103);
              });

              it("Should emit ValueChanged on addToValue in V3", async function () {
                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  await expect(proxyV3.addToValue()).to.emit(proxyV3, "ValueChanged").withArgs(103);
              });

              it("Should maintain V2 increment function in V3", async function () {
                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  // Value is 100, increment adds 2
                  await proxyV3.increment();
                  expect(await proxyV3.retrieve()).to.equal(102);
              });

              it("Should allow chaining increment and addToValue", async function () {
                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);

                  // Starting value: 100
                  await proxyV3.increment(); // 100 + 2 = 102
                  await proxyV3.addToValue(); // 102 + 3 = 105
                  await proxyV3.increment(); // 105 + 2 = 107

                  expect(await proxyV3.retrieve()).to.equal(107);
              });
          });

          describe("Complete Upgrade Path (V1 -> V2 -> V3)", function () {
              it("Should successfully upgrade through all versions and preserve state", async function () {
                  // Deploy V1
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementationV1 = await UpgradeableContract.deploy();
                  await implementationV1.waitForDeployment();

                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementationV1.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  // Get ProxyAdmin
                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );

                  // Test V1
                  const proxyV1 = await ethers.getContractAt("UpgradeableContract", proxyAddress);
                  await proxyV1.store(10);
                  expect(await proxyV1.version()).to.equal(1);
                  expect(await proxyV1.retrieve()).to.equal(10);

                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x");

                  // Test V2
                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);
                  expect(await proxyV2.version()).to.equal(2);
                  expect(await proxyV2.retrieve()).to.equal(10); // Value preserved

                  await proxyV2.increment(); // 10 + 2 = 12
                  expect(await proxyV2.retrieve()).to.equal(12);

                  // Upgrade to V3
                  const UpgradeableContractV3 = await ethers.getContractFactory("UpgradeableContractV3");
                  const implementationV3 = await UpgradeableContractV3.deploy();
                  await implementationV3.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV3.getAddress(), "0x");

                  // Test V3
                  const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", proxyAddress);
                  expect(await proxyV3.version()).to.equal(3);
                  expect(await proxyV3.retrieve()).to.equal(12); // Value preserved

                  await proxyV3.addToValue(); // 12 + 3 = 15
                  expect(await proxyV3.retrieve()).to.equal(15);

                  await proxyV3.increment(); // 15 + 2 = 17
                  expect(await proxyV3.retrieve()).to.equal(17);
              });
          });

          describe("Access Control and Security", function () {
              beforeEach(async function () {
                  // Deploy V1
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementationV1 = await UpgradeableContract.deploy();
                  await implementationV1.waitForDeployment();

                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementationV1.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  // Get ProxyAdmin
                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );
              });

              it("Should not allow non-owner to upgrade", async function () {
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2 = await UpgradeableContractV2.deploy();
                  await implementationV2.waitForDeployment();

                  await expect(
                      proxyAdmin.connect(addr1).upgradeAndCall(proxyAddress, await implementationV2.getAddress(), "0x"),
                  ).to.be.reverted;
              });

              it("Should verify ProxyAdmin owner is correct", async function () {
                  const actualOwner = await proxyAdmin.owner();
                  expect(actualOwner).to.equal(owner.address);
              });
          });

          describe("Edge Cases", function () {
              beforeEach(async function () {
                  // Deploy complete setup
                  const UpgradeableContract = await ethers.getContractFactory("UpgradeableContract");
                  const implementationV1 = await UpgradeableContract.deploy();
                  await implementationV1.waitForDeployment();

                  const TransparentUpgradeableProxy = await ethers.getContractFactory(
                      "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
                  );
                  const proxyContract = await TransparentUpgradeableProxy.deploy(
                      await implementationV1.getAddress(),
                      owner.address,
                      "0x",
                  );
                  await proxyContract.waitForDeployment();

                  proxyAddress = await proxyContract.getAddress();

                  const adminStorage = await ethers.provider.getStorage(proxyAddress, EIP1967_ADMIN_SLOT);
                  proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      proxyAdminAddress,
                  );

                  proxy = await ethers.getContractAt("UpgradeableContract", proxyAddress);
              });

              it("Should handle maximum uint256 value", async function () {
                  const maxUint256 = ethers.MaxUint256;
                  await proxy.store(maxUint256);
                  expect(await proxy.retrieve()).to.equal(maxUint256);
              });

              it("Should handle rapid consecutive calls", async function () {
                  for (let i = 1; i <= 10; i++) {
                      await proxy.store(i);
                      expect(await proxy.retrieve()).to.equal(i);
                  }
              });

              it("Should work after multiple upgrades to same version", async function () {
                  // Upgrade to V2
                  const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
                  const implementationV2_1 = await UpgradeableContractV2.deploy();
                  await implementationV2_1.waitForDeployment();

                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2_1.getAddress(), "0x");

                  const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", proxyAddress);
                  await proxyV2.store(50);

                  // Deploy another V2 implementation
                  const implementationV2_2 = await UpgradeableContractV2.deploy();
                  await implementationV2_2.waitForDeployment();

                  // Upgrade to another V2
                  await proxyAdmin.upgradeAndCall(proxyAddress, await implementationV2_2.getAddress(), "0x");

                  // Value should still be preserved
                  expect(await proxyV2.retrieve()).to.equal(50);
                  expect(await proxyV2.version()).to.equal(2);
              });
          });
      });
