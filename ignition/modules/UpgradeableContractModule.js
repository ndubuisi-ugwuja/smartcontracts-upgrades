const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractModule", (m) => {
  // Deploy implementation
  const implementation = m.contract("UpgradeableContract");

  // Deploy ProxyAdmin
  const proxyAdmin = m.contract("UpgradeableContractProxyAdmin", [
    m.getAccount(0), // owner of ProxyAdmin
  ]);

  // Encode initializer call (optional but recommended)
  const initData = m.encodeFunctionCall(
    implementation,
    "initialize",
    [], // initializer args
  );

  // Deploy TransparentUpgradeableProxy
  const proxy = m.contract("TransparentUpgradeableProxy", [
    implementation,
    proxyAdmin,
    initData,
  ]);

  return {
    implementation,
    proxyAdmin,
    proxy,
  };
});
