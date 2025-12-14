const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractModuleV2", (m) => {
  const upgradeableContractV2 = m.contract("UpgradeableContractV2");
  return { upgradeableContractV2 };
});
