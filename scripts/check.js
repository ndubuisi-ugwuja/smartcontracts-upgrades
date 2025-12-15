require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;
    const IMPLEMENTATION_ADDRESS = process.env.UPGRADABLECONTRACTADDRESS;
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;

    console.log("\n=== Sepolia Contract Diagnostic ===\n");
    console.log("Proxy:", PROXY_ADDRESS);
    console.log("Implementation:", IMPLEMENTATION_ADDRESS);
    console.log("ProxyAdmin:", PROXY_ADMIN_ADDRESS);
    console.log("");

    // 1. Check if contracts have code
    console.log("→ Checking deployed bytecode...");
    const proxyCode = await ethers.provider.getCode(PROXY_ADDRESS);
    const implCode = await ethers.provider.getCode(IMPLEMENTATION_ADDRESS);
    const adminCode = await ethers.provider.getCode(PROXY_ADMIN_ADDRESS);

    console.log("Proxy has code:", proxyCode !== "0x" && proxyCode.length > 2);
    console.log("Implementation has code:", implCode !== "0x" && implCode.length > 2);
    console.log("ProxyAdmin has code:", adminCode !== "0x" && adminCode.length > 2);
    console.log("");

    // 2. Read implementation from proxy storage
    console.log("→ Reading implementation address from proxy...");
    const EIP1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const storedImpl = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_IMPLEMENTATION_SLOT);
    const implFromProxy = "0x" + storedImpl.slice(-40);
    console.log("Implementation in proxy storage:", implFromProxy);
    console.log("Expected implementation:", IMPLEMENTATION_ADDRESS);
    console.log("Match:", implFromProxy.toLowerCase() === IMPLEMENTATION_ADDRESS.toLowerCase());
    console.log("");

    // 3. Try calling implementation directly
    console.log("→ Testing implementation contract directly...");
    try {
        const impl = await ethers.getContractAt("UpgradeableContract", IMPLEMENTATION_ADDRESS);
        const version = await impl.version();
        console.log("✓ Implementation version:", version.toString());
    } catch (error) {
        console.log("✗ Implementation call failed:", error.message);
    }
    console.log("");

    // 4. Try calling through proxy
    console.log("→ Testing proxy call...");
    try {
        const proxy = await ethers.getContractAt("UpgradeableContract", PROXY_ADDRESS);
        const version = await proxy.version();
        console.log("✓ Proxy version:", version.toString());
    } catch (error) {
        console.log("✗ Proxy call failed:", error.message);
    }
    console.log("");

    console.log("=== Diagnostic Complete ===\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
