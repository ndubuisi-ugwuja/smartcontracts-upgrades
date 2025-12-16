require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const RECORDED_PROXY_ADMIN = "0x7BFcDe425c075Ba76216C415a33f0D6503C12108";
    const ACTUAL_PROXY_ADMIN = "0x290F84BE566e9E45436B4ca4ddb120ded79D49eB";

    console.log("\n=== Transferring ProxyAdmin Ownership ===\n");

    const [signer] = await ethers.getSigners();
    console.log("Your address:", signer.address);
    console.log("");

    // Get the recorded ProxyAdmin (which you own)
    const recordedPA = await ethers.getContractAt("UpgradeableContractProxyAdmin", RECORDED_PROXY_ADMIN);

    // Get the actual ProxyAdmin (to transfer ownership to yourself)
    const actualPA = await ethers.getContractAt("UpgradeableContractProxyAdmin", ACTUAL_PROXY_ADMIN);

    console.log("→ Current ownership:");
    const currentOwner = await actualPA.owner();
    console.log("Actual ProxyAdmin owner:", currentOwner);
    console.log("");

    console.log("→ Transferring ownership to yourself...");
    try {
        // Call transferOwnership on the actual ProxyAdmin through the recorded one
        // We need to encode the call
        const transferData = actualPA.interface.encodeFunctionData("transferOwnership", [signer.address]);

        // Execute this through the recorded ProxyAdmin
        const tx = await signer.sendTransaction({
            to: ACTUAL_PROXY_ADMIN,
            data: transferData,
            gasLimit: 100000,
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);
        await tx.wait();
        console.log("✓ Ownership transferred!");
        console.log("");

        // Verify
        const newOwner = await actualPA.owner();
        console.log("→ New owner:", newOwner);
        console.log("You are now owner:", newOwner.toLowerCase() === signer.address.toLowerCase());
        console.log("");

        console.log("====================================");
        console.log("✓ Setup complete!");
        console.log("====================================");
        console.log("Now update your .env:");
        console.log(`PROXYADMINADDRESS=${ACTUAL_PROXY_ADMIN}`);
        console.log("");
        console.log("Then run the upgrade script again!");
        console.log("====================================\n");
    } catch (error) {
        console.error("✗ Transfer failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
