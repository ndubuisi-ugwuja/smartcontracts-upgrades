const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractV2Module", (m) => {
    const upgradeableContractV2 = m.contract("UpgradeableContractV2");
    return { upgradeableContractV2 };
});
