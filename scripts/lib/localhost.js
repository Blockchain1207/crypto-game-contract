const hre = require("hardhat")

var fs = require('fs')
const BN = require('bignumber.js')

const { syncDeployInfo, deployContract, deployContractAndProxy } = require('./deploy')
const { addressZero, bytes32Zero, maxUint256,
   } = require('./const')

const deploy_localhost = async (specialAccounts) => {
    let network = 'localhost'
    const { admin, pancakeFeeSetter } = specialAccounts

    let totalRet = []
    try {
      let readInfo = fs.readFileSync(`scripts/deploy-${network}.json`)
      totalRet = JSON.parse(readInfo)
    } catch(err) {
      console.log(`${err.message}`)
    }
    // console.log(totalRet)

    let usdtInfo = totalRet.find(t => t.name === "MockUSDT")
    let vaultInfo = totalRet.find(t => t.name === "USDTVault")
    let consoleInfo = totalRet.find(t => t.name === "Console")
    
    let houseInfo = totalRet.find(t => t.name === "House")
    let rngInfo = totalRet.find(t => t.name === "RNG")
    // let dice2Info = totalRet.find(t => t.name === "GameDice2")
    let rouletteInfo = totalRet.find(t => t.name === "GameRoulette")
    let coinflipInfo = totalRet.find(t => t.name === "GameCoinflip")
    let rpsInfo = totalRet.find(t => t.name === "GameRPS")
    let diceInfo = totalRet.find(t => t.name === "GameDice")

    
    // deploy
    usdtInfo = await deployContract("MockUSDT")
    totalRet = syncDeployInfo(network, "MockUSDT", usdtInfo, totalRet)

    vaultInfo = await deployContract("USDTVault", usdtInfo.imple)
    totalRet = syncDeployInfo(network, "USDTVault", vaultInfo, totalRet)

    consoleInfo = await deployContract("Console")
    totalRet = syncDeployInfo(network, "Console", consoleInfo, totalRet)

    rngInfo = await deployContract("RNG")
    totalRet = syncDeployInfo(network, "RNG", rngInfo, totalRet)

    houseInfo = await deployContract("House", vaultInfo.imple, usdtInfo.imple, consoleInfo.imple)
    totalRet = syncDeployInfo(network, "House", houseInfo, totalRet)

    // dice2Info = await deployContract("GameDice2", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 0, 1)
    // totalRet = syncDeployInfo(network, "GameDice2", dice2Info, totalRet)

    rouletteInfo = await deployContract("GameRoulette", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 1, 1)
    totalRet = syncDeployInfo(network, "GameRoulette", rouletteInfo, totalRet)

    coinflipInfo = await deployContract("GameCoinflip", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 2, 1)
    totalRet = syncDeployInfo(network, "GameCoinflip", coinflipInfo, totalRet)

    rpsInfo = await deployContract("GameRPS", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 3, 1)
    totalRet = syncDeployInfo(network, "GameRPS", rpsInfo, totalRet)

    diceInfo = await deployContract("GameDice", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 4, 1)
    totalRet = syncDeployInfo(network, "GameDice", diceInfo, totalRet)
}

module.exports = { deploy_localhost }
