const hre = require("hardhat");

var fs = require("fs");
const BN = require("bignumber.js");

const {
  syncDeployInfo,
  deployContract,
  deployContractAndProxy,
} = require("./lib/deploy");
const { addressZero, bytes32Zero, maxUint256 } = require("./lib/const");

async function main() {
  let network = "goerli";

  let totalRet = [];
  try {
    let readInfo = fs.readFileSync(`scripts/deploy-${network}.json`);
    totalRet = JSON.parse(readInfo);
  } catch (err) {
    console.log(`${err.message}`);
  }
  // console.log(totalRet);

  let usdtInfo = totalRet.find((t) => t.name === "MockUSDT");
  let vaultInfo = totalRet.find((t) => t.name === "USDTVault");
  let consoleInfo = totalRet.find((t) => t.name === "Console");
  
  let houseInfo = totalRet.find((t) => t.name === "House");
  let rngInfo = totalRet.find((t) => t.name === "RNG");

  // deploy
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

  console.log("diceinfo", diceInfo);

  totalRet = syncDeployInfo(network, "GameDice", diceInfo, totalRet);


  const Dice = await hre.ethers.getContractFactory("GameDice");
  diceContract = await Dice.attach(diceInfo.imple);

  const USDTVault = await hre.ethers.getContractFactory("USDTVault");
  vaultContract = await USDTVault.attach(vaultInfo.imple);

  const Console = await hre.ethers.getContractFactory("Console");
  consoleContract = await Console.attach(consoleInfo.imple);
  
  await consoleContract.addGame(true, "Dice", 1, diceContract.address);
  await vaultContract.addToGameContractList(diceContract.address);
};

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
