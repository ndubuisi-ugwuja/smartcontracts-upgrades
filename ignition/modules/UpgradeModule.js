const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeModule", (m) => {
    const proxyAddress = process.env.PROXYADDRESS;
    const proxyAdminAddress = process.env.PROXYADMINADDRESS;

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

    // Get EXISTING ProxyAdmin (use unique ID to avoid conflict)
    console.log("→ Connecting to ProxyAdmin...");

    const proxyAdmin = m.contractAt(
        "UpgradeableContractProxyAdmin",

        proxyAdminAddress,

        { id: "ExistingProxyAdmin" }, // Add unique ID
    );

    console.log("✓ ProxyAdmin connected");
    console.log("");

    // Upgrade
    console.log("→ Executing upgrade transaction...");
    m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, upgradeableContractV2, "0x"], {
        id: "UpgradeToV2Call", // Add unique ID
    });

    console.log("✓ Upgrade transaction queued");
    console.log("");
    console.log("====================================");
    console.log("Upgrade Complete!");
    console.log("====================================\n");

    return { upgradeableContractV2 };
});
