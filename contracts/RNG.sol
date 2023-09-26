// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IChainlinkPrice {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

contract RNG is Ownable
{
    error InvalidModuloRange(uint256 lo, uint256 hi);

    uint256[10] private randSeed;
    uint256 private randIndex;

    IChainlinkPrice public chainlink;

    constructor() Ownable() {
        // Initialize contract
        randIndex = 0;

        // https://docs.chain.link/docs/data-feeds/price-feeds/addresses
        // chainlink = IChainlinkPrice(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419); // chainlink contracts on ethereum mainnet
    }

    function updateChainlink(address _int) external onlyOwner {
        require(address(chainlink) != _int, "Already Set");
        chainlink = IChainlinkPrice(_int);
    }

    function generateNextRandomVariable() public returns (uint256) {
        uint256 tPrice = 0;

        if (address(chainlink) != address(0)) {
            try chainlink.latestRoundData() returns (uint80, int256 ret, uint256, uint256, uint80) {
                tPrice = uint256(ret);
            } catch {
            }
        }

        uint256 tval = (block.timestamp << 224);
        tval |= (tPrice << 160);
        tval |= (randSeed[randIndex] >> 96);

        uint256 randNextIndex = (randIndex + 1) % randSeed.length;
        uint256 temp1 = ((tval >> 128) ^ tval) & 0x7fffffffffffffffffffffffffffffff;
        uint256 finalValue = uint256(keccak256(abi.encodePacked(temp1 * 16095906970532733010342422905366867027 + 1531170596534094249064966829041812247)));

        randSeed[randNextIndex] = temp1 ^ finalValue;
        randIndex = randNextIndex;

        return finalValue;
    }

    function generateModulo(uint256 lo, uint256 hi) external returns (uint256) {
        uint256 v = generateNextRandomVariable();
        if (lo >= hi) {
            revert InvalidModuloRange(lo, hi);
        }

        return (v % (hi + 1 - lo)) + lo;
    }

    function getModulo(uint256 val, uint256 lo, uint256 hi) external pure returns (uint256) {
        if (lo >= hi) {
            revert InvalidModuloRange(lo, hi);
        }

        return (val % (hi + 1 - lo)) + lo;
    }

    function generateMultiple(uint256 count) external returns (uint256[] memory) {
        uint256[] memory ra = new uint256[](count);
        uint256 i;

        for (i = 0; i < count; i ++) {
            ra[i] = generateNextRandomVariable();
        }

        return ra;
    }

    function shuffleRandomNumbers() external {
        uint256 i;
        for (i = 0; i < randSeed.length; i ++) {
            generateNextRandomVariable();
        }
    }

    function updateRandSeed(uint256 val) external {
        randSeed[randIndex] = uint256(keccak256(abi.encodePacked(val)));
    }

    function getChainlinkPrice() external view returns (uint256) {
        uint256 tPrice = 0;
        if (address(chainlink) != address(0)) {
            try chainlink.latestRoundData() returns (uint80, int256 ret, uint256, uint256, uint80) {
                tPrice = uint256(ret);
            } catch {
            }
        }

        return tPrice;
    }
}
