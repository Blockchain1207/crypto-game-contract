const hre = require("hardhat")

advanceTime = async (time) => {
  return await hre.network.provider.request({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [time],
    id: new Date().getTime()
  })
}

advanceBlock = async () => {
  await hre.network.provider.request({
    jsonrpc: '2.0',
    method: 'evm_mine',
    id: new Date().getTime()
  })
}

takeSnapshot = async () => {
  return await hre.network.provider.send('evm_snapshot')
}

// id should be passed with takeSnapshot.return.result
revertToSnapShot = async (id) => {
  return await hre.network.provider.send('evm_revert', [id])
}

advanceTimeAndBlock = async (time) => {
  await advanceTime(time)
  return await advanceBlock()
}

module.exports = {
  advanceTime,
  advanceBlock,
  advanceTimeAndBlock,
  takeSnapshot,
  revertToSnapShot
}