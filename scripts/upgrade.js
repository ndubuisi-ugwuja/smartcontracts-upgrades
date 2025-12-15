const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Upgrading to V2 ===\n");
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("ProxyAdmin:", PROXY_ADMIN_ADDRESS);
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

    // 3. Upgrade proxy
    console.log("→ Upgrading proxy...");
    const proxyAdmin = await ethers.getContractAt("UpgradeableContractProxyAdmin", PROXY_ADMIN_ADDRESS);
    const upgradeTx = await proxyAdmin.upgradeAndCall(PROXY_ADDRESS, v2Address, "0x");
    console.log("Transaction hash:", upgradeTx.hash);
    await upgradeTx.wait();
    console.log("✓ Upgrade complete!");
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
    console.log("====================================\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
