require("@nomicfoundation/hardhat-toolbox");

const {
  GOERLI_DEPLOYER_KEY,
  ETHEREUM_DEPLOY_KEY
} = require("./env.json")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.info(account.address)
  }
})

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      gasPrice: 10000000000,
      // accounts: ['0x9b11242d64e39d91f7c37f248692a13e75d00f4591c6e52177e7784ada18ea7e', '0xa24f0a2d148db4bd5a2355a57d167946dcb6a4fbf99d8146ec91aa2630add6a3'],
      timeout: 120000
    },
    hardhat: {
      // allowUnlimitedContractSize: true
    },
    // bsctestnet: {
    //   url: "https://data-seed-prebsc-1-s3.binance.org:8545/",
    //   chainId: 97,
    //   gasPrice: 20000000000,
    //   accounts: [BSC_TESTNET_DEPLOYER_KEY]
    // },
    // bsc: {
    //   url: "",
    //   chainId: 56,
    //   gasPrice: 10000000000,
    //   accounts: ['0x']
    // },
    goerli: {
      url: "https://goerli.infura.io/v3/f2c3624a719d49cf83f59034a3ed28dd",
      chainId: 5,
      gasPrice: 71000000000,
      accounts: [GOERLI_DEPLOYER_KEY]
    },
    ethereum: {
      url: 'https://mainnet.infura.io/v3/7535811d19b1410e98c261fbb638651a',
      chainId: 1,
      gasPrice: 61500000000,
      accounts: [ETHEREUM_DEPLOY_KEY]
    }
  },
  etherscan: {
    apiKey: {
      goerli: 'AIW87TX33382ST7YH1BHQI8N3D1DCN6UN7'
      // mainnet: MAINNET_DEPLOY_KEY,
      // bsc: BSCSCAN_API_KEY,
    }
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};
