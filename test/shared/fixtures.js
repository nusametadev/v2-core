const { ethers } = require('hardhat')

const { expandTo18Decimals } = require('./utilities')

// Stand-in WNGRX address; also TEST_ADDRESSES[0] in UniswapV2Factory.spec so those pairs are NGRX pairs.
const WNGRX = '0x1000000000000000000000000000000000000000'

async function factoryFixture() {
  const [wallet, other] = await ethers.getSigners()
  const factory = await ethers.deployContract('UniswapV2Factory', [wallet.address, WNGRX, wallet.address])
  return { wallet, other, factory }
}

async function pairFixture() {
  const { wallet, other, factory } = await factoryFixture()

  const tokenA = await ethers.deployContract('ERC20', [expandTo18Decimals(10000)])
  const tokenB = await ethers.deployContract('ERC20', [expandTo18Decimals(10000)])

  // Neither token is WNGRX, so the pair must be whitelisted by the admin (wallet) first.
  await factory.setPairAllowed(await tokenA.getAddress(), await tokenB.getAddress(), true)
  await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress())
  const pairAddress = await factory.getPair(await tokenA.getAddress(), await tokenB.getAddress())
  const pair = await ethers.getContractAt('UniswapV2Pair', pairAddress)

  const token0Address = await pair.token0()
  const token0 = (await tokenA.getAddress()) === token0Address ? tokenA : tokenB
  const token1 = (await tokenA.getAddress()) === token0Address ? tokenB : tokenA

  return { wallet, other, factory, token0, token1, pair }
}

module.exports = { WNGRX, factoryFixture, pairFixture }
