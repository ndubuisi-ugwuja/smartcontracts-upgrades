require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = process.env.PROXYADDRESS;

    console.log("\n=== Finding ProxyAdmin Address ===\n");

    // Read the admin slot from the proxy
    const EIP1967_ADMIN_SLOT = process.env.EIP1967ADMINSLOT;
    const adminStorage = await ethers.provider.getStorage(PROXY_ADDRESS, EIP1967_ADMIN_SLOT);
    const proxyAdminAddress = ethers.getAddress("0x" + adminStorage.slice(-40));

    console.log("ProxyAdmin Address:", proxyAdminAddress);
    console.log("");
    console.log("Update your .env:");
    console.log(`PROXYADMINADDRESS=${proxyAdminAddress}`);
}

main();
