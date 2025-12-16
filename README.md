# ⏫ Smart Contracts Upgrades

This project demonstrates how to build and upgrade Ethereum smart contracts using the **Transparent Proxy pattern** with **Hardhat** and **OpenZeppelin Contracts (v5)**.

## **[Click for a detailed explanation of how upgrades work.](contracts/index.md)**

It serves as a practical reference for understanding:

- Proxy-based upgradeability
- Implementation versioning
- Safe contract upgrades without losing on-chain state

---

## 🧠 Concepts Covered

- Transparent Proxy pattern
- ProxyAdmin (OpenZeppelin v5)
- Implementation upgrades (V1 → V2 → V3)
- Storage layout compatibility
- Hardhat deployment & upgrade scripts

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ndubuisi-ugwuja/smartcontracts-upgrades.git
cd smartcontracts-upgrades
```

### 2. Install dependencies

```bash
yarn install
```

### 3. 📦 Compile Contracts

```bash
yarn hardhat compile
```

### 4. 🚀 Deploy and verify Proxy (Initial Version)

```bash
yarn hardhat ignition deploy ignition/modules/UpgradeableContractModule.js --network sepolia --verify
```

### 5. Get proxy Admin address

```bash
yarn hardhat run scripts/getProxyAdmin.js --network sepolia
```

### 6. Configure environment variables

Create a .env file:

```env
SEPOLIA_RPC_URL=your_sepolia_rpc__url
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=api_key
COINMARKETCAP_API_KEY=api_key
PROXYADDRESS=your_proxy_address   // Address from step 4
PROXYADMINADDRESS=your_proxyadmin_address   // Address from step 5
EIP1967ADMINSLOT=0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
```

### 7. 🔁 Upgrade Contract

```bash
// Upgrade to version 2
yarn hardhat run scripts/upgradeToV2.js --network sepolia

// Upgrade to version 3
yarn hardhat run scripts/upgradeToV3.js --network sepolia
```

Each upgrade deploys a new implementation and updates the proxy via ProxyAdmin, while preserving contract state.

---

## ⚠️ Important Notes

- Storage layout must remain compatible between versions
- Never change the order or type of existing state variables
- Always test upgrades on testnets before mainnet

## 📜 License

This project is unlicensed.
You are free to use, modify, and integrate it into your own projects.

## Author

Ndubuisi Ugwuja
