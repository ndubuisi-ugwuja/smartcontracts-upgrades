const { ethers } = require("hardhat");

async function main() {
    // Use the actual proxy address from your deployment
    const PROXY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    console.log("\n=== Testing V1 ===\n");
    console.log("Proxy Address:", PROXY_ADDRESS);
    console.log("");

    try {
        // Get contract instance
        const contract = await ethers.getContractAt("UpgradeableContract", PROXY_ADDRESS);

        // Test version
        console.log("→ Checking version...");
        const version = await contract.version();
        console.log("✓ Version:", version.toString());
        console.log("");

        // Test retrieve first
        console.log("→ Retrieving current value...");
        const currentValue = await contract.retrieve();
        console.log("✓ Current value:", currentValue.toString());
        console.log("");

        // Test store
        console.log("→ Storing value 42...");
        const [signer] = await ethers.getSigners();
        const tx = await contract.connect(signer).store(42);
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✓ Transaction confirmed");
        console.log("");

        // Retrieve again
        console.log("→ Retrieving new value...");
        const newValue = await contract.retrieve();
        console.log("✓ New value:", newValue.toString());
        console.log("");

        console.log("====================================");
        console.log("✓ V1 working correctly!");
        console.log("====================================\n");
    } catch (error) {
        console.error("✗ Error:", error.message);
        console.log("\nFull error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
