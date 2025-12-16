require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;

    console.log("\n=== Finding ProxyAdmin Address ===\n");

    // Read the admin slot from the proxy
    const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
    const adminStorage = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_ADMIN_SLOT);
    const proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

    console.log("ProxyAdmin Address:", proxyAdminAddress);
    console.log("");
    console.log("Update your .env:");
    console.log(`PROXYADMINADDRESS=${proxyAdminAddress}`);
}

main();
