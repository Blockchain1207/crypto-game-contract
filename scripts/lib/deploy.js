const hre = require("hardhat");
const ABI = require('ethereumjs-abi')
const fs = require('fs');

const syncDeployInfo = (_network, _name, _info, _total) => {
    _total = [..._total.filter(t => t.name !== _name), _info];
    fs.writeFileSync(`scripts/deploy-${_network}.json`, JSON.stringify(_total));
    return _total;
}

const buildCallData = (functionName, types, values) => {
    var methodID = ABI.methodID(functionName, types);

    var encoded = buildEncodedData(types, values)

    return methodID.toString('hex') + encoded;
}

const buildEncodedData = (types, values) => {
    var encoded = hre.ethers.utils.defaultAbiCoder.encode(types, values);
    if (encoded.slice(0, 2) === '0x') {
        encoded = encoded.slice(2);
    }
    return encoded;

    var encoded = ABI.rawEncode(types, values);
    return encoded.toString('hex');
}

const deployContract = async (contractName, ...args) => {
    const ct = await hre.ethers.getContractFactory(contractName)
    const inst = await ct.deploy(...args)

    await inst.deployed();

    let cImplAddress = inst.address

    console.log(`${contractName} contract:`, cImplAddress);

    return {
        name: contractName,
        imple: cImplAddress
    }
}

const deployContractAndProxy = async (contractName, proxyName, admin, initializer, types, values) => {
    const ct = await hre.ethers.getContractFactory(contractName)
    const ctInst = await ct.deploy()
    await ctInst.deployed()

    let proxyConstructorParam = buildCallData(initializer, types, values);

    const proxy = await hre.ethers.getContractFactory(proxyName)
    const proxyInst = await proxy.deploy(ctInst.address, admin, "0x" + proxyConstructorParam)
    await proxyInst.deployed()

    let cProxyConstructParams = buildEncodedData(["address", "address", "bytes"], [
        ctInst.address, admin, Buffer.from(proxyConstructorParam, "hex")
    ])

    console.log(`${contractName} contract:`, ctInst.address)
    console.log(`${contractName} proxy:`, proxyInst.address)
    console.log(`${contractName} proxy constructor params:`, cProxyConstructParams)

    return {
        name: contractName,
        imple: ctInst.address,
        proxy: proxyInst.address,
        params: cProxyConstructParams
    }
}

const getProxyParam = async (name, initializer, types, values) => {
    let proxyConstructorParam = buildCallData(initializer, types, values);
    return {
        name: name,
        calldata: proxyConstructorParam
    }
}

module.exports = { syncDeployInfo, deployContract, deployContractAndProxy, getProxyParam, buildEncodedData};
