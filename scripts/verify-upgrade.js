const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Your proxy address

    console.log("\n=== Checking Contract Version ===\n");
    console.log("Proxy Address:", PROXY_ADDRESS);
    console.log("");

    try {
        // Check as V2 (since upgrade was successful)
        console.log("→ Connecting to upgraded contract...");
        const contractV2 = await ethers.getContractAt("UpgradeableContractV2", PROXY_ADDRESS);

        // Call version() - returns uint8
        const version = await contractV2.version();
        console.log("✓ Current Version:", version.toString()); // Convert BigInt to string

        // Test retrieve function
        const currentValue = await contractV2.retrieve();
        console.log("✓ Current stored value:", currentValue.toString());

        // Verify V2-specific increment function exists
        console.log("\n→ Testing V2-specific increment function...");
        const tx = await contractV2.increment();
        await tx.wait();
        console.log("✓ Increment transaction successful");

        const newValue = await contractV2.retrieve();
        console.log("✓ New value after increment:", newValue.toString());

        console.log("\n====================================");
        console.log("✓ Contract successfully upgraded to V2!");
        console.log("====================================\n");
    } catch (error) {
        console.error("✗ Error during verification:", error.message);
        console.log("\nFull error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
