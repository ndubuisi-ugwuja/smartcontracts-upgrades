const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractModule", (m) => {
    // Get the deployer account (or specify an owner address)
    const owner = m.getAccount(0);

    // Deploy ProxyAdmin first
    const proxyAdmin = m.contract("UpgradeableContractProxyAdmin", [owner]);

    // Deploy the implementation contract
    const implementation = m.contract("UpgradeableContract");

    // Deploy TransparentUpgradeableProxy
    const proxy = m.contract("TransparentUpgradeableProxy", [implementation, proxyAdmin, "0x"]);

    // Get proxied instance for interaction (with unique id)
    const proxiedContract = m.contractAt("UpgradeableContract", proxy, {
        id: "ProxiedUpgradeableContract",
    });

    return { proxyAdmin, implementation, proxy, proxiedContract };
});
