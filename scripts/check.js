const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    const IMPLEMENTATION_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const PROXY_ADMIN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    console.log("\n=== Proxy Diagnostic ===\n");

    // 1. Check proxy bytecode
    const proxyCode = await ethers.provider.getCode(PROXY_ADDRESS);
    console.log("1. Proxy has code:", proxyCode !== "0x" && proxyCode !== "0x0");
    console.log("   Bytecode length:", proxyCode.length);
    console.log("");

    // 2. Check implementation bytecode
    const implCode = await ethers.provider.getCode(IMPLEMENTATION_ADDRESS);
    console.log("2. Implementation has code:", implCode !== "0x" && implCode !== "0x0");
    console.log("   Bytecode length:", implCode.length);
    console.log("");

    // 3. Read implementation address from proxy storage
    const EIP1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const storedImpl = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT);
    const implFromStorage = ethers.getAddress("0x" + storedImpl.slice(-40));
    console.log("3. Implementation address in proxy storage:", implFromStorage);
    console.log("   Expected implementation address:", IMPLEMENTATION_ADDRESS);
    console.log("   Addresses match:", implFromStorage.toLowerCase() === IMPLEMENTATION_ADDRESS.toLowerCase());
    console.log("");

    // 4. Try calling implementation directly
    console.log("4. Testing implementation contract directly...");
    try {
        const implContract = await ethers.getContractAt("UpgradeableContract", IMPLEMENTATION_ADDRESS);
        const version = await implContract.version();
        console.log("   ✓ Direct call to implementation works! Version:", version.toString());
    } catch (error) {
        console.log("   ✗ Direct call failed:", error.message);
    }
    console.log("");

    // 5. Check ProxyAdmin
    const adminCode = await ethers.provider.getCode(PROXY_ADMIN_ADDRESS);
    console.log("5. ProxyAdmin has code:", adminCode !== "0x" && adminCode !== "0x0");
    console.log("   Bytecode length:", adminCode.length);
    console.log("");

    console.log("=== End Diagnostic ===\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
