const { ethers } = require('hardhat')

const { expandTo18Decimals } = require('./utilities')

async function factoryFixture() {
  const [wallet, other] = await ethers.getSigners()
  const factory = await ethers.deployContract('UniswapV2Factory', [wallet.address])
  return { wallet, other, factory }
}

async function pairFixture() {
  const { wallet, other, factory } = await factoryFixture()

  const tokenA = await ethers.deployContract('ERC20', [expandTo18Decimals(10000)])
  const tokenB = await ethers.deployContract('ERC20', [expandTo18Decimals(10000)])

  await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress())
  const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress())
  const pair = await ethers.getContractAt('UniswapV2Pair', pairAddress)

  const token0Address = await pair.token0()
  const token0 = (await tokenA.getAddress()) === token0Address ? tokenA : tokenB
  const token1 = (await tokenA.getAddress()) === token0Address ? tokenB : tokenA

  return { wallet, other, factory, token0, token1, pair }
}

module.exports = { factoryFixture, pairFixture }
