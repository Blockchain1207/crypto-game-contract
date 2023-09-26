// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IHouse.sol";
import "../interfaces/IERC20BackwardsCompatible.sol";
import "../interfaces/IConsole.sol";
import "../interfaces/IUSDTVault.sol";

contract House is IHouse, Ownable {
    error InvalidGame(uint256 _game, address _impl, bool _live);
    error AlreadyInitialized();
    error NotInitialized();
    error InsufficientVault(uint256 _betSize, uint256 _vaultSize);
    error MaxBetExceeded(uint256 _betSize, uint256 _maxBet);
    error InsufficientUSDBalance(uint256 _betSize, uint256 _balance);
    error InsufficientUSDAllowance(uint256 _betSize, uint256 _allowance);
    error BetCompleted(uint256 betId);

    address public usdtVault;

    uint256 public globalWagers; // Tracks total dollars wagered
    uint256 public globalBets; // Tracks total number of bets

    mapping (uint256 => Types.HouseGame) games; // statistics of games
    mapping (address => Types.Player2) players; // statistics of players

    uint256 public betFee = 100; // 1%

    IERC20BackwardsCompatible public usdtToken;
    IConsole public consoleInst;

    mapping(uint256 => Types.Bet) bets; // An array of every bet

    bool private initialized;

    constructor (address _vault, address _usdt, address _console) {
        usdtVault = _vault;
        usdtToken = IERC20BackwardsCompatible(_usdt);
        consoleInst = IConsole(_console);
    }

    function initialize() external onlyOwner {
        if (initialized) {
            revert AlreadyInitialized();
        }

        initialized = true;
    }

    function calculateBetFee(uint256 _stake) public view returns (uint256) {
        uint256 _feeAmount = _stake * betFee / 10000;
        return _feeAmount;
    }

    function openWager(address _account, uint256 _gameId, uint256 _rolls, uint256 _bet, uint256[50] calldata _data, uint256 _stake, uint256 _maxPayout) external returns (uint256, uint256) {
        if (!initialized) {
            revert NotInitialized();
        }

        {
            Types.Game memory _game = consoleInst.getGame(_gameId);
            if (msg.sender != _game.impl || address(0) == _game.impl || !_game.live) {
                revert InvalidGame(_gameId, _game.impl, _game.live);
            }
        }

        uint256 _betSize = _stake * _rolls;
        uint256 _betSizeWithFee = (_stake + calculateBetFee(_stake)) * _rolls;
        if (_betSizeWithFee > usdtToken.balanceOf(usdtVault)) {
            revert InsufficientVault(_betSize, usdtToken.balanceOf(usdtVault));
        }

        // 2.5% of vault
        {
            uint256 betLimit = (usdtToken.balanceOf(usdtVault) * 25 / 1000);
            uint256 maxBetPrize = 0;
            if (_maxPayout >= PAYOUT_AMPLIFIER) {
                maxBetPrize = _betSize * (_maxPayout - PAYOUT_AMPLIFIER) / PAYOUT_AMPLIFIER;
            }

            if (maxBetPrize > betLimit) {
                revert MaxBetExceeded(maxBetPrize, betLimit);
            }
        }

        {
            uint256 userBalance = usdtToken.balanceOf(_account);
            if (_betSizeWithFee > userBalance) {
                revert InsufficientUSDBalance(_betSizeWithFee, userBalance);
            }
        }

        {
            uint256 userAllowance = usdtToken.allowance(_account, address(this));
            if (_betSizeWithFee > userAllowance) {
                revert InsufficientUSDAllowance(_betSizeWithFee, userAllowance);
            }
        }

        // take bet
        usdtToken.transferFrom(_account, usdtVault, _betSizeWithFee);

        bets[globalBets] = Types.Bet(globalBets, players[_account].info.betCount, _gameId, _rolls, _bet, _stake, 0, false, block.timestamp, 0, _data, _account);

        globalBets += 1;
        globalWagers += _betSize;

        players[_account].info.betCount ++;
        players[_account].info.betIds.push(globalBets);
        players[_account].info.wagers += _betSize;
        games[_gameId].betCount += 1;
        games[_gameId].betIds.push(globalBets);

        return (globalBets - 1, _betSizeWithFee);
    }

    function closeWager(uint256 betId, address _account, uint256 _gameId, uint256 _payout) external returns (bool) {
        // validate game
        Types.Game memory _game = consoleInst.getGame(_gameId);
        if (msg.sender != _game.impl || address(0) == _game.impl) {
            revert InvalidGame(_gameId, _game.impl, _game.live);
        }

        // validate bet
        Types.Bet memory _bet = bets[betId];
        if (_bet.complete) {
            revert BetCompleted(betId);
        }

        // close bet
        _bet.payout = _payout;
        _bet.complete = true;
        _bet.closed = block.timestamp;
        bets[betId] = _bet;

        // pay out winnings & receive losses
        players[_account].games[_gameId].betCount += 1;
        players[_account].games[_gameId].wagers += _bet.stake * _bet.rolls;

        if (_payout > _bet.stake) {
            uint256 _profit = _payout - _bet.stake;

            players[_account].info.profits += _profit;
            players[_account].games[_gameId].profits += _profit;
            players[_account].info.wins += 1;
            players[_account].games[_gameId].wins += 1;
        } else {
            players[_account].info.losses ++;
            players[_account].games[_gameId].losses ++;
        }

        return _payout > _bet.stake;
    }

    function getBetsByGame(uint256 _game, uint256 _from, uint256 _to) external view returns (Types.Bet[] memory) {
        uint256 betCount = games[_game].betCount;

        if (_to >= betCount) _to = betCount;
        if (_from > _to) _from = 0;

        Types.Bet[] memory _Bets;
        uint256 _counter;
        
        for (uint256 _i = _from; _i < _to; _i++) {
            _Bets[_counter] = bets[games[_game].betIds[_i]];
            _counter++;
        }
        return _Bets;
    }
    
    function getBets(uint256 _from, uint256 _to) external view returns (Types.Bet[] memory) {
        if (_to >= globalBets) _to = globalBets;
        if (_from > _to) _from = 0;

        Types.Bet[] memory _Bets;
        uint256 _counter;

        for (uint256 _i = _from; _i < _to; _i++) {
            _Bets[_counter] = bets[_i];
            _counter++;
        }

        return _Bets;
    }

    function getBet(uint256 _betId) external view returns (Types.Bet memory) {
        return bets[_betId];
    }

    function getPlayer(address _user) external view returns (Types.Player memory) {
        return players[_user].info;
    }

    function getPlayerGame(address _user, uint256 _gameId) external view returns (Types.PlayerGame memory) {
        return players[_user].games[_gameId];
    }

    function getGame(uint256 _gameId) external view returns (Types.HouseGame memory) {
        return games[_gameId];
    }

    function setUSDTToken(address _newUSDT) external onlyOwner {
        require(address(usdtToken) != _newUSDT, "Already Set");
        usdtToken = IERC20BackwardsCompatible(_newUSDT);
    }

    function setUSDTVault(address _newVaule) external onlyOwner {
        require(usdtVault != _newVaule, "Already Set");
        usdtVault = _newVaule;
    }

    function setConsoleInst(address _newConsole) external onlyOwner {
        require(address(consoleInst) != _newConsole, "Already Set");
        consoleInst = IConsole(_newConsole);
    }
}
