const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractModule", (m) => {
  const upgradeableContract = m.contract("UpgradeableContract");
  return { upgradeableContract };
});
