// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Game.sol";

contract GameDice is Game {
    // error InvalidBet(uint256 bet);
    error InvalidData(uint256 _stake, uint256[50] _data);

    constructor (address _usdt, address _vault, address _console, address _house, address _rng, uint256 _id, uint256 _numbersPerRoll)
        Game(_usdt, _vault, _console, _house, _rng, _id, _numbersPerRoll)
    {}

    function finalize(uint256 _betId, uint256[] memory _randomNumbers) internal virtual override returns (uint256) {
        Types.Bet memory _bet = house.getBet(_betId);
        uint256[50] memory _bets = _bet.data;
        uint256[] memory _rolls = new uint256[](_bet.rolls);

        emit GameStart(_betId, _bet.betNum, _bets);

        uint256 payoutRatio = getMaxPayout(_bet.betNum, _bet.data);
        uint256 _payout = 0;
        uint256 wins = 0;
        uint256 losses = 0;


        uint256 selCnt = selectedCount(_bets);
        if (selCnt == 0 || selCnt == 6) revert InvalidData(_bet.stake, _bets);

        for (uint256 _i = 0; _i < _bet.rolls; _i++) {
            uint256 _roll = rng.getModulo(_randomNumbers[_i], 0, 5);

            if (_bets[_roll] == 1) {
                _payout += _bet.stake * payoutRatio / PAYOUT_AMPLIFIER;
                wins ++;
            } else {
                losses ++;
            }

            _rolls[_i] = _roll;
        }

        emit GameEnd(_betId, _randomNumbers, _rolls, _bet.betNum, _bet.stake, wins, /*0,*/ losses, _payout, _bet.player, block.timestamp);
        return _payout;
    }

    function getMaxPayout(uint256, uint256[50] memory _data) public virtual override view returns (uint256) {
        uint256 selCnt = selectedCount(_data);

        if (selCnt == 0 || selCnt == 6) revert InvalidData(0, _data);

        Types.Game memory ga = consoleInst.getGame(id);
        return 6 * (100 - ga.edge) * PAYOUT_AMPLIFIER / (100 * selCnt);
    }

    function selectedCount(uint256[50] memory _data) internal pure returns (uint256) {
        uint256 selCnt = 0;
        for (uint i = 0; i < 6; i++) {
            if (_data[i] > 0) selCnt++;
        }

        return selCnt;
    }
}
