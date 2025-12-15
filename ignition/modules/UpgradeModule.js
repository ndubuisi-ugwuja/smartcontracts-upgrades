const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeModule", (m) => {
    const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Your proxy address
    const proxyAdminAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Your ProxyAdmin address

    console.log("\n====================================");
    console.log("Starting Contract Upgrade");
    console.log("====================================");
    console.log("Proxy Address:", proxyAddress);
    console.log("ProxyAdmin Address:", proxyAdminAddress);
    console.log("");

    // Deploy new implementation
    console.log("→ Deploying UpgradeableContractV2...");
    const upgradeableContractV2 = m.contract("UpgradeableContractV2");
    console.log("✓ V2 implementation deployment queued");
    console.log("");

    // Get ProxyAdmin
    console.log("→ Connecting to ProxyAdmin...");
    const proxyAdmin = m.contractAt("UpgradeableContractProxyAdmin", proxyAdminAddress);
    console.log("✓ ProxyAdmin connected");
    console.log("");

    // Upgrade
    console.log("→ Executing upgrade transaction...");
    m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, upgradeableContractV2, "0x"]);
    console.log("✓ Upgrade transaction queued");
    console.log("");

    console.log("====================================");
    console.log("Upgrade Complete!");
    console.log("====================================\n");

    return { upgradeableContractV2 };
});
