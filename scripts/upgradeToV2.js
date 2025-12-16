require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Upgrading to V2 (OZ v5 Standard ProxyAdmin) ===\n");
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("ProxyAdmin:", PROXY_ADMIN_ADDRESS);
    console.log("");

    const [signer] = await ethers.getSigners();
    console.log("Deployer:", signer.address);
    console.log("");

    // 1. Check V1 version
    console.log("→ Checking current version...");
    const proxyV1 = await ethers.getContractAt("UpgradeableContract", PROXY_ADDRESS);
    const currentVersion = await proxyV1.version();
    console.log("✓ Current version:", currentVersion.toString());
    console.log("");

    // 2. Deploy V2 implementation
    console.log("→ Deploying UpgradeableContractV2...");
    const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
    const v2Implementation = await UpgradeableContractV2.deploy();
    await v2Implementation.waitForDeployment();
    const v2Address = await v2Implementation.getAddress();
    console.log("✓ V2 deployed at:", v2Address);
    console.log("");

    // 3. Use OpenZeppelin's standard ProxyAdmin ABI (not your custom one)
    console.log("→ Connecting to OpenZeppelin ProxyAdmin...");

    // Import OpenZeppelin's ProxyAdmin
    const proxyAdmin = await ethers.getContractAt(
        "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin",
        PROXY_ADMIN_ADDRESS,
    );

    console.log("→ Executing upgrade...");
    try {
        const tx = await proxyAdmin.upgradeAndCall(PROXY_ADDRESS, v2Address, "0x", { gasLimit: 300000 });

        console.log("Transaction hash:", tx.hash);
        console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("Waiting for confirmation...");

        const receipt = await tx.wait();
        console.log("✓ Upgrade complete! Block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
    } catch (error) {
        console.error("✗ Upgrade failed:", error.message);
        throw error;
    }
    console.log("");

    // 4. Verify upgrade
    console.log("→ Verifying upgrade...");
    const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", PROXY_ADDRESS);
    const newVersion = await proxyV2.version();
    console.log("✓ New version:", newVersion.toString());

    // Test V2 specific function
    console.log("\n→ Testing V2 increment function...");
    const tx2 = await proxyV2.increment();
    await tx2.wait();
    const value = await proxyV2.retrieve();
    console.log("✓ Value after increment:", value.toString());
    console.log("");

    console.log("✓ Successfully upgraded to V2!");
    console.log("V2 Implementation:", v2Address);
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("View on Etherscan:", `https://sepolia.etherscan.io/address/${PROXY_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
