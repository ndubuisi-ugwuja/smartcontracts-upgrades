require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Debugging Upgrade Issue ===\n");

    const [signer] = await ethers.getSigners();
    console.log("Deployer address:", signer.address);
    console.log("");

    // 1. Check who owns the ProxyAdmin
    const proxyAdmin = await ethers.getContractAt("UpgradeableContractProxyAdmin", PROXY_ADMIN_ADDRESS);

    console.log("→ Checking ProxyAdmin owner...");
    try {
        const owner = await proxyAdmin.owner();
        console.log("ProxyAdmin owner:", owner);
        console.log("Your address:", signer.address);
        console.log("You are owner:", owner.toLowerCase() === signer.address.toLowerCase());
    } catch (error) {
        console.log("✗ Could not get owner:", error.message);
    }
    console.log("");

    // 2. Check current implementation
    console.log("→ Checking current implementation...");
    try {
        const currentImpl = await proxyAdmin.getProxyImplementation(PROXY_ADDRESS);
        console.log("Current implementation:", currentImpl);
    } catch (error) {
        console.log("✗ Could not get implementation:", error.message);
    }
    console.log("");

    // 3. Deploy V2 and try upgrade with better error handling
    console.log("→ Deploying V2...");
    const UpgradeableContractV2 = await ethers.getContractFactory("UpgradeableContractV2");
    const v2Implementation = await UpgradeableContractV2.deploy();
    await v2Implementation.waitForDeployment();
    const v2Address = await v2Implementation.getAddress();
    console.log("✓ V2 deployed at:", v2Address);
    console.log("");

    // 4. Try the upgrade with detailed error catching
    console.log("→ Attempting upgrade...");
    try {
        // Try without data first
        const upgradeTx = await proxyAdmin.upgrade(PROXY_ADDRESS, v2Address);
        console.log("Transaction hash:", upgradeTx.hash);
        await upgradeTx.wait();
        console.log("✓ Upgrade successful!");
    } catch (error) {
        console.log("✗ Upgrade failed with 'upgrade' method");
        console.log("Error:", error.message);
        console.log("");

        // Try with upgradeAndCall
        console.log("→ Trying upgradeAndCall...");
        try {
            const upgradeTx = await proxyAdmin.upgradeAndCall(PROXY_ADDRESS, v2Address, "0x");
            console.log("Transaction hash:", upgradeTx.hash);
            await upgradeTx.wait();
            console.log("✓ Upgrade successful!");
        } catch (error2) {
            console.log("✗ upgradeAndCall also failed");
            console.log("Error:", error2.message);

            // Get the full error
            if (error2.data) {
                console.log("Error data:", error2.data);
            }
        }
    }

    console.log("\n=== Debug Complete ===\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
