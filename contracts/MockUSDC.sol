// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor () ERC20("MockUSDC", "USDC") {
        _mint(msg.sender, 10_000_000 * 10 ** 18);
    }
}
