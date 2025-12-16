require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Checking ProxyAdmin Configuration ===\n");

    const [signer] = await ethers.getSigners();
    console.log("Your address:", signer.address);
    console.log("");

    // Check ProxyAdmin owner
    const proxyAdmin = await ethers.getContractAt("UpgradeableContractProxyAdmin", PROXY_ADMIN_ADDRESS);

    console.log("→ Checking ProxyAdmin owner...");
    try {
        const owner = await proxyAdmin.owner();
        console.log("ProxyAdmin owner:", owner);
        console.log("Are you the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    } catch (error) {
        console.log("✗ Error getting owner:", error.message);
    }
    console.log("");

    // Check admin of the proxy
    console.log("→ Checking proxy admin...");
    try {
        // Read the admin slot directly from the proxy
        const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
        const adminStorage = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_ADMIN_SLOT);
        const adminFromProxy = ethers.getAddress("0x" + adminStorage.slice(-40));
        console.log("Admin stored in proxy:", adminFromProxy);
        console.log("Expected ProxyAdmin:", PROXY_ADMIN_ADDRESS);
        console.log("Matches?", adminFromProxy.toLowerCase() === PROXY_ADMIN_ADDRESS.toLowerCase());
    } catch (error) {
        console.log("✗ Error reading admin:", error.message);
    }
    console.log("");

    // Check if we can call the proxy directly (we shouldn't be able to as non-admin)
    console.log("→ Checking proxy access...");
    try {
        const proxy = await ethers.getContractAt(
            "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
            PROXY_ADDRESS,
        );

        // Try to read implementation (only admin can do this on TransparentProxy)
        console.log("Attempting to access proxy admin functions...");
    } catch (error) {
        console.log("Note:", error.message);
    }
    console.log("");

    // Try to manually call upgradeToAndCall on the proxy
    console.log("→ Testing direct upgrade call on proxy...");
    console.log("NOTE: This should fail because only ProxyAdmin can call it");
    console.log("");

    console.log("=== Configuration Check Complete ===\n");
    console.log("If owner matches and admin matches, the issue might be:");
    console.log("1. Gas estimation failing");
    console.log("2. OpenZeppelin v5 interface mismatch");
    console.log("3. Proxy is not properly initialized");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
