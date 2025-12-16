const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeableContractModule", (m) => {
    // Get the deployer account
    const owner = m.getAccount(0);

    // Deploy the implementation contract
    const implementation = m.contract("UpgradeableContract");

    // In OpenZeppelin v5, TransparentUpgradeableProxy creates its own ProxyAdmin internally
    // The second parameter is the initial owner (not a ProxyAdmin address)
    const proxy = m.contract("TransparentUpgradeableProxy", [
        implementation, // implementation address
        owner, // initial owner (NOT ProxyAdmin address!)
        "0x", // initialization data
    ]);

    // Get the ProxyAdmin address that was created by the proxy
    // We'll need to retrieve this after deployment

    // Get proxied instance for interaction
    const proxiedContract = m.contractAt("UpgradeableContract", proxy, {
        id: "ProxiedUpgradeableContract",
    });

    return { implementation, proxy, proxiedContract };
});
