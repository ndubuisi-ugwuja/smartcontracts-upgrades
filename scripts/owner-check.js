const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADMIN_ADDRESS = process.env.PROXYADMINADDRESS;
    const proxyAdmin = await ethers.getContractAt("UpgradeableContractProxyAdmin", PROXY_ADMIN_ADDRESS);

    console.log("ProxyAdmin owner:", await proxyAdmin.owner());
    console.log("Signer:", (await ethers.getSigners())[0].address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
