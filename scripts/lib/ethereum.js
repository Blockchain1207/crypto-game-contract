const hre = require("hardhat");

var fs = require("fs");
const BN = require("bignumber.js");

const {
  syncDeployInfo,
  deployContract,
  deployContractAndProxy,
} = require("./deploy");
const { addressZero, bytes32Zero, maxUint256 } = require("./const");

const deploy_ethereum = async () => {
  let network = "ethereum";

  let totalRet = [];
  try {
    let readInfo = fs.readFileSync(`scripts/deploy-${network}.json`);
    totalRet = JSON.parse(readInfo);
  } catch (err) {
    console.log(`${err.message}`);
  }
  // console.log(totalRet);

  let usdtInfo = totalRet.find((t) => t.name === "USDT");
  let vaultInfo = totalRet.find((t) => t.name === "USDTVault");
  let consoleInfo = totalRet.find((t) => t.name === "Console");
  
  let houseInfo = totalRet.find((t) => t.name === "House");
  let rngInfo = totalRet.find((t) => t.name === "RNG");
  let diceInfo = totalRet.find((t) => t.name === "GameDice");
  let rouletteInfo = totalRet.find((t) => t.name === "GameRoulette");
  let coinflipInfo = totalRet.find((t) => t.name === "GameCoinflip");
  let rpsInfo = totalRet.find((t) => t.name === "GameRPS");

  
  // deploy
  usdtInfo = {
    name: "USDT",
    imple: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  };
  totalRet = syncDeployInfo(network, "USDT", usdtInfo, totalRet);

  vaultInfo = await deployContract("USDTVault", usdtInfo.imple);
  totalRet = syncDeployInfo(network, "USDTVault", vaultInfo, totalRet);

  consoleInfo = await deployContract("Console");
  totalRet = syncDeployInfo(network, "Console", consoleInfo, totalRet);

  rngInfo = await deployContract("RNG");
  totalRet = syncDeployInfo(network, "RNG", rngInfo, totalRet);

  houseInfo = await deployContract("House", vaultInfo.imple, usdtInfo.imple, consoleInfo.imple);
  totalRet = syncDeployInfo(network, "House", houseInfo, totalRet);

  diceInfo = await deployContract(
    "GameDice",
    usdtInfo.imple,
    vaultInfo.imple,
    consoleInfo.imple,
    houseInfo.imple,
    rngInfo.imple,
    0,
    1
  );
  totalRet = syncDeployInfo(network, "GameDice", diceInfo, totalRet);

  rouletteInfo = await deployContract(
    "GameRoulette",
    usdtInfo.imple,
    vaultInfo.imple,
    consoleInfo.imple,
    houseInfo.imple,
    rngInfo.imple,
    1,
    1
  );
  totalRet = syncDeployInfo(network, "GameRoulette", rouletteInfo, totalRet);

  coinflipInfo = await deployContract(
    "GameCoinflip",
    usdtInfo.imple,
    vaultInfo.imple,
    consoleInfo.imple,
    houseInfo.imple,
    rngInfo.imple,
    2,
    1
  );
  totalRet = syncDeployInfo(network, "GameCoinflip", coinflipInfo, totalRet);
  
  rpsInfo = await deployContract(
    "GameRPS",
    usdtInfo.imple,
    vaultInfo.imple,
    consoleInfo.imple,
    houseInfo.imple,
    rngInfo.imple,
    3,
    1
  );
  totalRet = syncDeployInfo(network, "GameRPS", rpsInfo, totalRet);

  
  // configure
  const USDT = await hre.ethers.getContractFactory("USDT");
  usdtContract = await USDT.attach(usdtInfo.imple);

  const USDTVault = await hre.ethers.getContractFactory("USDTVault");
  vaultContract = await USDTVault.attach(vaultInfo.imple);

  const Console = await hre.ethers.getContractFactory("Console");
  consoleContract = await Console.attach(consoleInfo.imple);

  const RNG = await hre.ethers.getContractFactory("RNG");
  rngContract = await RNG.attach(rngInfo.imple);

  const House = await hre.ethers.getContractFactory("House");
  houseContract = await House.attach(houseInfo.imple);

  const Dice = await hre.ethers.getContractFactory("GameDice");
  diceContract = await Dice.attach(diceInfo.imple);

  const Roulette = await hre.ethers.getContractFactory("GameRoulette");
  rouletteContract = await Roulette.attach(rouletteInfo.imple);

  const Coinflip = await hre.ethers.getContractFactory("GameCoinflip");
  coinflipContract = await Coinflip.attach(coinflipInfo.imple);

  const RPS = await hre.ethers.getContractFactory("GameRPS");
  rpsContract = await RPS.attach(rpsInfo.imple);

  // await rngContract.updateChainlink(
  //   "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
  // );
  await rngContract.updateRandSeed(new Date().getTime());
  await rngContract.shuffleRandomNumbers();

  await houseContract.initialize();
  await consoleContract.addGame(true, "Dice", 1, diceContract.address);
  await vaultContract.addToGameContractList(diceContract.address);
  await consoleContract.addGame(true, "Roulette", 1, rouletteContract.address);
  await vaultContract.addToGameContractList(rouletteContract.address);
  await consoleContract.addGame(true, "Coinflip", 1, coinflipContract.address);
  await vaultContract.addToGameContractList(coinflipContract.address);
  await consoleContract.addGame(true, "RPS", 1, rpsContract.address);
  await vaultContract.addToGameContractList(rpsContract.address);
};

module.exports = { deploy_ethereum };
