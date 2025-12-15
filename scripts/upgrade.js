require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Upgrading to V2 ===\n");
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
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${v2Address}`);
    console.log("");

    // 3. Get ProxyAdmin using OpenZeppelin's ProxyAdmin ABI
    console.log("→ Upgrading proxy...");
    const ProxyAdmin = await ethers.getContractFactory("UpgradeableContractProxyAdmin");
    const proxyAdmin = ProxyAdmin.attach(PROXY_ADMIN_ADDRESS);

    // Call upgradeAndCall with proper parameters
    // TransparentUpgradeableProxy address, new implementation, data
    const data = "0x"; // No initialization data needed

    try {
        const upgradeTx = await proxyAdmin.upgradeAndCall(PROXY_ADDRESS, v2Address, data);
        console.log("Transaction hash:", upgradeTx.hash);
        console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${upgradeTx.hash}`);
        console.log("Waiting for confirmation...");
        await upgradeTx.wait();
        console.log("✓ Upgrade complete!");
    } catch (error) {
        console.error("✗ Upgrade failed:", error.message);

        // Try to get more details
        if (error.data) {
            console.log("Error data:", error.data);
        }
        throw error;
    }
    console.log("");

    // 4. Verify upgrade
    console.log("→ Verifying upgrade...");
    const proxyV2 = await ethers.getContractAt("UpgradeableContractV2", PROXY_ADDRESS);
    const newVersion = await proxyV2.version();
    console.log("✓ New version:", newVersion.toString());
    console.log("");

    console.log("====================================");
    console.log("✓ Successfully upgraded to V2!");
    console.log("====================================");
    console.log("V2 Implementation:", v2Address);
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("View on Etherscan:", `https://sepolia.etherscan.io/address/${PROXY_ADDRESS}`);
    console.log("====================================\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
