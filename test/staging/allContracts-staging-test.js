const { expect } = require("chai");
const { ethers, network } = require("hardhat");
require("dotenv").config();

const developmentChains = ["hardhat", "localhost"];

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Upgradeable Contracts - Full Staging Test Suite", function () {
          let deployer;
          let proxy, proxyAdmin;
          const PROXY_ADDRESS = process.env.PROXYADDRESS;
          const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;
          const EIP1967_ADMIN_SLOT = process.env.EIP1967ADMINSLOT;
          const EIP1967_IMPLEMENTATION_SLOT = process.env.EIP1967IMPLEMENTATIONSLOT;

          this.timeout(300000);

          before(async function () {
              if (!PROXY_ADDRESS || !PROXY_ADMIN_ADDRESS) {
                  throw new Error("Please set PROXYADDRESS and PROXYADMINADDRESS in .env file");
              }

              console.log("Proxy:", PROXY_ADDRESS);
              console.log("ProxyAdmin:", PROXY_ADMIN_ADDRESS);

              [deployer] = await ethers.getSigners();
              console.log("Test runner:", deployer.address);
          });

          describe("Contract State Verification", function () {
              it("Should connect to deployed contracts", async function () {
                  console.log("Connecting to contracts...");

                  // Detect version by trying each interface
                  try {
                      const proxyV3 = await ethers.getContractAt("UpgradeableContractV3", PROXY_ADDRESS);
                      const version = await proxyV3.version();

                      if (version === BigInt(3)) {
                          proxy = proxyV3;
                          console.log("✓ Connected to V3 proxy");
                      } else if (version === BigInt(2)) {
                          proxy = await ethers.getContractAt("UpgradeableContractV2", PROXY_ADDRESS);
                          console.log("✓ Connected to V2 proxy");
                      } else {
                          proxy = await ethers.getContractAt("UpgradeableContract", PROXY_ADDRESS);
                          console.log("✓ Connected to V1 proxy");
                      }
                  } catch (error) {
                      throw new Error("Failed to connect to proxy: " + error.message);
                  }

                  proxyAdmin = await ethers.getContractAt(
                      "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
                      PROXY_ADMIN_ADDRESS,
                  );

                  console.log("✓ Connected to ProxyAdmin");
              });

              it("Should verify current version", async function () {
                  console.log("Checking version...");
                  const version = await proxy.version();
                  console.log("✓ Current version:", version.toString());
                  expect(version).to.be.oneOf([BigInt(1), BigInt(2), BigInt(3)]);
              });

              it("Should read current value", async function () {
                  console.log("Reading current value...");
                  const value = await proxy.retrieve();
                  console.log("✓ Current value:", value.toString());
              });

              it("Should verify you own the ProxyAdmin", async function () {
                  console.log("Verifying ownership...");
                  const owner = await proxyAdmin.owner();
                  console.log("ProxyAdmin owner:", owner);
                  console.log("Your address:", deployer.address);
                  expect(owner).to.equal(deployer.address);
                  console.log("✓ You own the ProxyAdmin");
              });
          });

          describe("Functional Tests", function () {
              it("Should store and retrieve a value", async function () {
                  console.log("Testing store/retrieve...");

                  const testValue = 12345;
                  const tx = await proxy.store(testValue);
                  console.log("   Transaction:", tx.hash);

                  await tx.wait();

                  const value = await proxy.retrieve();
                  expect(value).to.equal(testValue);
                  console.log("✓ Successfully stored and retrieved:", value.toString());
              });

              it("Should test version-specific functions", async function () {
                  const version = await proxy.version();

                  if (version >= BigInt(2)) {
                      console.log("Testing increment (V2+ feature)...");
                      const valueBefore = await proxy.retrieve();
                      await (await proxy.increment()).wait();
                      const valueAfter = await proxy.retrieve();
                      expect(valueAfter).to.equal(valueBefore + BigInt(2));
                      console.log("✓ Increment works");
                  }

                  if (version >= BigInt(3)) {
                      console.log("Testing addToValue (V3 feature)...");
                      const valueBefore = await proxy.retrieve();
                      await (await proxy.addToValue()).wait();
                      const valueAfter = await proxy.retrieve();
                      expect(valueAfter).to.equal(valueBefore + BigInt(3));
                      console.log("✓ AddToValue works");
                  }
              });
          });

          describe("Implementation Verification", function () {
              it("Should verify implementation address", async function () {
                  console.log("Checking implementation...");

                  const implStorage = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT);
                  const implAddress = ethers.getAddress("0x" + implStorage.slice(-40));

                  console.log("Implementation address:", implAddress);
                  console.log("Etherscan:", `https://sepolia.etherscan.io/address/${implAddress}`);

                  expect(implAddress).to.not.equal(ethers.ZeroAddress);
                  console.log("✓ Implementation verified");
              });

              it("Should verify admin address", async function () {
                  console.log("Checking admin...");

                  const adminStorage = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_ADMIN_SLOT);
                  const adminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

                  console.log("Admin from storage:", adminAddress);
                  console.log("Expected admin:", PROXY_ADMIN_ADDRESS);

                  expect(adminAddress.toLowerCase()).to.equal(PROXY_ADMIN_ADDRESS.toLowerCase());
                  console.log("✓ Admin address matches");
              });
          });
      });
