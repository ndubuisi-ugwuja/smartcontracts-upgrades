// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

contract UpgradeableContractProxyAdmin is ProxyAdmin {
    constructor(address owner) ProxyAdmin(owner) {}
}