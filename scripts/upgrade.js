const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeModule", (m) => {
    const proxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Your proxy address
    const proxyAdminAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Your ProxyAdmin address

    // Deploy new implementation
    const upgradeableContractV2 = m.contract("UpgradeableContractV2");

    // Get ProxyAdmin
    const proxyAdmin = m.contractAt("UpgradeableContractProxyAdmin", proxyAdminAddress);

    // Upgrade
    m.call(proxyAdmin, "upgradeAndCall", [proxyAddress, upgradeableContractV2, "0x"]);

    return { upgradeableContractV2 };
});
