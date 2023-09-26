const assert = require("assert")
const { expect } = require("chai")
const BN = require('bignumber.js')

const { advanceTime, advanceBlock, takeSnapshot, revertToSnapShot, advanceTimeAndBlock } = require("./lib/utils.js")
const { maxUint256, addressZero } = require('../scripts/lib/const')
const { deployContract } = require('../scripts/lib/deploy')

describe("Casino", function () {
    BN.config({
        EXPONENTIAL_AT: [-10, 64]
    })

    const BN2Decimal = function (t, decimal) {
        if (decimal === undefined) decimal = 18
        return BN(t.toString()).div(BN(`1e${decimal}`)).toString()
    }
    
    const T2B = function (t, decimal) {
        if (decimal === undefined) decimal = 18
        return BN(t).times(BN(`1e${decimal}`)).integerValue().toString()
    }

    let accounts

    before("", async function() {
        accounts = await hre.ethers.getSigners()
    })

    describe("Game", function () {
        let usdtContract
        let vaultContract
        let consoleContract
        let rngContract
        let houseContract
        let dice2Contract
        let rouletteContract
        let coinflipContract
        let rpsContract
        let diceContract

        let user1
        let user2
        let user3
        let user4

        before("", async function () {
            user1 = accounts[1]
            user2 = accounts[2]
            user3 = accounts[3]
            user4 = accounts[4]

            // deploy first
            const usdtInfo = await deployContract("MockUSDT")
            const vaultInfo = await deployContract("USDTVault", usdtInfo.imple)

            const consoleInfo = await deployContract("Console")
            const rngInfo = await deployContract("RNG")
            const houseInfo = await deployContract("House", vaultInfo.imple, usdtInfo.imple, consoleInfo.imple)
            const dice2Info = await deployContract("GameDice2", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 0, 1)
            const rouletteInfo = await deployContract("GameRoulette", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 1, 1)
            const coinflipInfo = await deployContract("GameCoinflip", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 2, 1)
            const rpsInfo = await deployContract("GameRPS", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 3, 1)
            const diceInfo = await deployContract("GameDice", usdtInfo.imple, vaultInfo.imple, consoleInfo.imple, houseInfo.imple, rngInfo.imple, 4, 1)

            
            // get address of contracts
            const MockUSDT = await hre.ethers.getContractFactory("MockUSDT")
            usdtContract = await MockUSDT.attach(usdtInfo.imple)

            const USDTVault = await hre.ethers.getContractFactory("USDTVault")
            vaultContract = await USDTVault.attach(vaultInfo.imple)
            
            const Console = await hre.ethers.getContractFactory("Console")
            consoleContract = await Console.attach(consoleInfo.imple)

            const RNG = await hre.ethers.getContractFactory("RNG")
            rngContract = await RNG.attach(rngInfo.imple)

            const House = await hre.ethers.getContractFactory("House")
            houseContract = await House.attach(houseInfo.imple)

            const Dice2 = await hre.ethers.getContractFactory("GameDice2")
            dice2Contract = await Dice2.attach(dice2Info.imple)

            const Roulette = await hre.ethers.getContractFactory("GameRoulette")
            rouletteContract = await Roulette.attach(rouletteInfo.imple)

            const Coinflip = await hre.ethers.getContractFactory("GameCoinflip")
            coinflipContract = await Coinflip.attach(coinflipInfo.imple)

            const RPS = await hre.ethers.getContractFactory("GameRPS")
            rpsContract = await RPS.attach(rpsInfo.imple)

            const Dice = await hre.ethers.getContractFactory("GameDice")
            diceContract = await Dice.attach(diceInfo.imple)
        })

        it ("configuration of casino", async function () {
            // await rngContract.updateChainlink("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419") // ethereum mainnet
            await rngContract.updateRandSeed((new Date()).getTime())
            await rngContract.shuffleRandomNumbers()

            await houseContract.initialize()
            await consoleContract.addGame(true, "Dice2", 1, dice2Contract.address)
            await vaultContract.addToGameContractList(dice2Contract.address)
            await consoleContract.addGame(true, "Roulette", 1, rouletteContract.address)
            await vaultContract.addToGameContractList(rouletteContract.address)
            await consoleContract.addGame(true, "Coinflip", 1, coinflipContract.address)
            await vaultContract.addToGameContractList(coinflipContract.address)
            await consoleContract.addGame(true, "RPS", 1, rpsContract.address)
            await vaultContract.addToGameContractList(rpsContract.address)
            await consoleContract.addGame(true, "Dice", 1, diceContract.address)
            await vaultContract.addToGameContractList(diceContract.address)

            await usdtContract.transfer(vaultContract.address, T2B('100000'))

            // only for test
            await dice2Contract.updateMaxRoll(0)
            await rouletteContract.updateMaxRoll(0)
            await coinflipContract.updateMaxRoll(0)
            await rpsContract.updateMaxRoll(0)
			await diceContract.updateMaxRoll(0)
        })

        it ("mint USDT to accounts", async function () {
            let i
            for (i = 1; i < 10; i++) {
                await usdtContract.transfer(accounts[i].address, T2B('1000'))
            }
        })

        it ("play dice2 game", async function () {
            let oldB = await usdtContract.balanceOf(user1.address)
            console.log('oldBalance', oldB)

            await usdtContract.connect(user1).approve(houseContract.address, maxUint256)
            const rolls = 10
            let tx = await dice2Contract.connect(user1).play(rolls, 67, Array.from({ length: 50 }).map((u, i) => 0), T2B('0.1'))
            const receipt = await tx.wait()
            console.log(receipt.cumulativeGasUsed, BN(receipt.cumulativeGasUsed.toString()).times('0.000000022857969194').toNumber())    // ilesoviy - How is the value 0.000000022857969194 calculated?
            const events = receipt.events?.filter(x => x.eventSignature !== undefined)

            // console.log(events.map(t => { return {
            //     args: t.args,
            //     ev: t.event,
            //     ev2: t.eventSignature
            // }}))

            const ti = events.find(t => t.event === "GameEnd")
            console.log('bet id', ti.args.betId.toString())
            console.log('stake per roll', BN2Decimal(ti.args._stake))
            console.log('rolls', ti.args._rolls)
            console.log('wins', ti.args.wins.toString())
            console.log('losses', ti.args.losses.toString())
            console.log('wager', BN2Decimal(BN(ti.args._stake.toString()).times(rolls)))
            console.log('payout', BN2Decimal(ti.args._payout))

            let newB = await usdtContract.balanceOf(user1.address)
            console.log('newBalance', newB)

            assert(BN(oldB.toString()).minus(BN(ti.args._stake.toString()).times(rolls).times(1.01).integerValue()).plus(BN(ti.args._payout.toString())).eq(BN(newB.toString())), "payout inconsistency")
        })

        it ("play roulette game", async function () {
            let oldB = await usdtContract.balanceOf(user2.address)
            await usdtContract.connect(user2).approve(houseContract.address, maxUint256)
            const rolls = 10
            let tx = await rouletteContract.connect(user2).play(rolls, 0, Array.from({ length: 50 }).map((u, i) => (i) < 10 ? BN(1).times(0.001).times(BN(`1e18`)).toString(): "0"), T2B('0.01'))
            const receipt = await tx.wait()
            console.log(receipt.cumulativeGasUsed, BN(receipt.cumulativeGasUsed.toString()).times('0.000000022857969194').toNumber())
            const events = receipt.events?.filter(x => x.eventSignature !== undefined)
            // console.log(events.map(t => { return {
            //     args: t.args,
            //     ev: t.event,
            //     ev2: t.eventSignature
            // }}))

            const ti = events.find(t => t.event === "GameEnd")
            console.log('bet id', ti.args.betId.toString())
            console.log('stake per roll', BN2Decimal(ti.args._stake))
            console.log('rolls', ti.args._rolls)
            console.log('wins', ti.args.wins.toString())
            console.log('losses', ti.args.losses.toString())
            console.log('wager', BN2Decimal(BN(ti.args._stake.toString()).times(rolls)))
            console.log('payout', BN2Decimal(ti.args._payout))
            assert(BN(oldB.toString()).minus(BN(ti.args._stake.toString()).times(rolls).times(1.01).integerValue()).plus(BN(ti.args._payout.toString())).eq(BN((await usdtContract.balanceOf(user2.address)).toString())), "payout inconsistency")
        })

        it ("play coinflip game", async function () {
            let oldB = await usdtContract.balanceOf(user3.address)
            
            await usdtContract.connect(user3).approve(houseContract.address, maxUint256)
            
            const rolls = 10
            let tx = await coinflipContract.connect(user3).play(rolls, 1/*HEAD*/, Array.from({ length: 50 }).map((u, i) => 0), T2B('0.1'))
            const receipt = await tx.wait()
            
            console.log(receipt.cumulativeGasUsed, BN(receipt.cumulativeGasUsed.toString()).times('0.000000022857969194').toNumber())
            const events = receipt.events?.filter(x => x.eventSignature !== undefined)
            // console.log(events.map(t => { return {
            //     args: t.args,
            //     ev: t.event,
            //     ev2: t.eventSignature
            // }}))

            const ti = events.find(t => t.event === "GameEnd")
            console.log('bet id', ti.args.betId.toString())
            console.log('stake per roll', BN2Decimal(ti.args._stake))
            console.log('rolls', ti.args._rolls)
            console.log('wins', ti.args.wins.toString())
            console.log('losses', ti.args.losses.toString())
            console.log('wager', BN2Decimal(BN(ti.args._stake.toString()).times(rolls)))
            console.log('payout', BN2Decimal(ti.args._payout))

            assert(BN(oldB.toString()).minus(BN(ti.args._stake.toString()).times(rolls).times(1.01).integerValue()).plus(BN(ti.args._payout.toString())).eq(BN((await usdtContract.balanceOf(user3.address)).toString())), "payout inconsistency")
        })

        it ("play rps game", async function () {
            let oldB = await usdtContract.balanceOf(user4.address)
            
            await usdtContract.connect(user4).approve(houseContract.address, maxUint256)
            
            const rolls = 10
            let tx = await rpsContract.connect(user4).play(rolls, 2 /*Plain*/, Array.from({ length: 50 }).map((u, i) => 0), T2B('0.01'))
            const receipt = await tx.wait()
            
            console.log(receipt.cumulativeGasUsed, BN(receipt.cumulativeGasUsed.toString()).times('0.000000022857969194').toNumber())
            const events = receipt.events?.filter(x => x.eventSignature !== undefined)
            // console.log(events.map(t => { return {
            //     args: t.args,
            //     ev: t.event,
            //     ev2: t.eventSignature
            // }}))

            const ti = events.find(t => t.event === "GameEnd")
            console.log('bet id', ti.args.betId.toString())
            console.log('stake per roll', BN2Decimal(ti.args._stake))
            console.log('rolls', ti.args._rolls)
            console.log('wins', ti.args.wins.toString())
            console.log('losses', ti.args.losses.toString())
            console.log('wager', BN2Decimal(BN(ti.args._stake.toString()).times(rolls)))
            console.log('payout', BN2Decimal(ti.args._payout))

            assert(BN(oldB.toString()).minus(BN(ti.args._stake.toString()).times(rolls).times(1.01).integerValue()).plus(BN(ti.args._payout.toString())).eq(BN((await usdtContract.balanceOf(user4.address)).toString())), "payout inconsistency")
        })

        it ("play dice game", async function () {
            let oldB = await usdtContract.balanceOf(user1.address)
            
            await usdtContract.connect(user1).approve(houseContract.address, maxUint256)
            
            const rolls = 10
            let tx = await diceContract.connect(user1).play(rolls, 0, 
                Array.from({ length: 50 }).map((u, i) => i < 5 ? (i + 1) : ((i == 5) ? 0 : ((i == 6) ? 5 : 0))), 
                T2B('0.1'))
            const receipt = await tx.wait()
            
            console.log(receipt.cumulativeGasUsed, BN(receipt.cumulativeGasUsed.toString()).times('0.000000022857969194').toNumber())
            const events = receipt.events?.filter(x => x.eventSignature !== undefined)
            // console.log(events.map(t => { return {
            //     args: t.args,
            //     ev: t.event,
            //     ev2: t.eventSignature
            // }}))

            const ti = events.find(t => t.event === "GameEnd")
            console.log('bet id', ti.args.betId.toString())
            console.log('stake per roll', BN2Decimal(ti.args._stake))
            console.log('rolls', ti.args._rolls)
            console.log('wins', ti.args.wins.toString())
            console.log('losses', ti.args.losses.toString())
            console.log('wager', BN2Decimal(BN(ti.args._stake.toString()).times(rolls)))
            console.log('payout', BN2Decimal(ti.args._payout))

            assert(BN(oldB.toString()).minus(BN(ti.args._stake.toString()).times(rolls).times(1.01).integerValue()).plus(BN(ti.args._payout.toString())).eq(BN((await usdtContract.balanceOf(user1.address)).toString())), "payout inconsistency")
        })
    })
})
