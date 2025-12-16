require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    console.log("\n=== Investigating Admin Addresses ===\n");

    const RECORDED_PROXY_ADMIN = "0x7BFcDe425c075Ba76216C415a33f0D6503C12108";
    const ACTUAL_PROXY_ADMIN = "0x290F84BE566e9E45436B4ca4ddb120ded79D49eB";
    const PROXY_ADDRESS = "0xfA30b2c9f902849Ef98F1c25dA824F29ec7f7B80";

    // Check if both addresses have code
    console.log("→ Checking recorded ProxyAdmin (from deployed_addresses.json):");
    console.log("Address:", RECORDED_PROXY_ADMIN);
    const recordedCode = await ethers.provider.getCode(RECORDED_PROXY_ADMIN);
    console.log("Has code:", recordedCode.length > 2);
    console.log("Code length:", recordedCode.length);
    console.log("");

    console.log("→ Checking actual ProxyAdmin (stored in proxy):");
    console.log("Address:", ACTUAL_PROXY_ADMIN);
    const actualCode = await ethers.provider.getCode(ACTUAL_PROXY_ADMIN);
    console.log("Has code:", actualCode.length > 2);
    console.log("Code length:", actualCode.length);
    console.log("");

    // Check ownership of actual ProxyAdmin
    if (actualCode.length > 2) {
        console.log("→ Checking ownership of actual ProxyAdmin:");
        try {
            const proxyAdmin = await ethers.getContractAt("UpgradeableContractProxyAdmin", ACTUAL_PROXY_ADMIN);
            const owner = await proxyAdmin.owner();
            const [signer] = await ethers.getSigners();
            console.log("Owner:", owner);
            console.log("Your address:", signer.address);
            console.log("You are owner:", owner.toLowerCase() === signer.address.toLowerCase());
        } catch (error) {
            console.log("✗ Error:", error.message);
        }
        console.log("");
    }

    // Check all deployment history
    console.log("→ Checking deployment history:");
    console.log("Look in ignition/deployments/chain-11155111/ for journal files");
    console.log("");

    console.log("=== Investigation Complete ===");
    console.log("\nPossible scenarios:");
    console.log("1. You deployed contracts multiple times");
    console.log("2. Ignition recorded wrong address");
    console.log("3. Proxy was deployed with different ProxyAdmin than recorded");
    console.log("\nSolution: Use the ACTUAL ProxyAdmin address from the proxy:");
    console.log("PROXYADMINADDRESS=" + ACTUAL_PROXY_ADMIN);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
