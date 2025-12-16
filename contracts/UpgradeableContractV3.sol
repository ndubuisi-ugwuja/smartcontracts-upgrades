// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract UpgradeableContractV2 {
    uint256 internal value;

    event ValueChanged(uint256 newValue);

    function store(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }

    function retrieve() public view returns (uint256) {
        return value;
    }

    function version() public pure returns (uint8) {
        return 3;
    }

    function addToValue() public {
        value = value + 3;
        emit ValueChanged(value);
    }
}
