// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDTVault is Ownable {
    using SafeMath for uint256;

    IERC20 public usdtToken;
    address public treasuryWallet;

    mapping (address => bool) isGameContracts;
    
    modifier onlyGameContracts() {
        require(isGameContracts[msg.sender], "Not Game Contract");
        _;
    }
    
    constructor (address _usdt) {
        usdtToken = IERC20(_usdt);
        treasuryWallet = 0x92208Bff3a44d2B0978c963bBA07879467000Ae2;
    }

    function withdrawToTreasury(uint256 _amount) external onlyOwner {
        uint256 _balance = usdtToken.balanceOf(address(this));
        // uint256 vaultThreshold = totalSupply().mul(13000).div(RESOLUTION); // over 130% of total deposited usdt - ilesoviy ???

        require (_balance >= _amount/*  + vaultThreshold */, "Too much requested");
        usdtToken.transfer(msg.sender, _amount);
    }

    function finalizeGame(address _player, uint256 _prize, uint256 _fee) external onlyGameContracts {
        if (_prize > 0) {
            usdtToken.transfer(_player, _prize);
        }

        if (_fee > 0) {
            usdtToken.transfer(treasuryWallet, _fee);
        }
    }

    function setTreasuryWallet(address newTreasury) external onlyOwner {
        require(treasuryWallet != newTreasury, "Already Set");
        treasuryWallet = newTreasury;
    }

    function setUSDTToken(address _newUSDT) external onlyOwner {
        usdtToken = IERC20(_newUSDT);
    }

    function addToGameContractList(address _game) external onlyOwner {
        isGameContracts[_game] = true;
    }

    function removeFromGameContractList(address _game) external onlyOwner {
        isGameContracts[_game] = false;
    }
}
