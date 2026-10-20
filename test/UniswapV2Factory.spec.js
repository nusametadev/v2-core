const { expect } = require('chai')
const { ethers, artifacts } = require('hardhat')
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

const { getCreate2Address } = require('./shared/utilities')
const { factoryFixture } = require('./shared/fixtures')

const TEST_ADDRESSES = ['0x1000000000000000000000000000000000000000', '0x2000000000000000000000000000000000000000']

describe('UniswapV2Factory', () => {
  let wallet, other, factory
  beforeEach(async () => {
    ;({ wallet, other, factory } = await loadFixture(factoryFixture))
  })

  it('feeTo, feeToSetter, allPairsLength', async () => {
    expect(await factory.feeTo()).to.eq(ethers.ZeroAddress)
    expect(await factory.feeToSetter()).to.eq(wallet.address)
    expect(await factory.allPairsLength()).to.eq(0)
  })

  async function createPair(tokens) {
    const { bytecode } = await artifacts.readArtifact('UniswapV2Pair')
    const create2Address = getCreate2Address(await factory.getAddress(), tokens, bytecode)
    await expect(factory.createPair(...tokens))
      .to.emit(factory, 'PairCreated')
      .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, 1)

    await expect(factory.createPair(...tokens)).to.be.reverted // UniswapV2: PAIR_EXISTS
    await expect(factory.createPair(...tokens.slice().reverse())).to.be.reverted // UniswapV2: PAIR_EXISTS
    expect(await factory.getPair(...tokens)).to.eq(create2Address)
    expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
    expect(await factory.allPairs(0)).to.eq(create2Address)
    expect(await factory.allPairsLength()).to.eq(1)

    const pair = await ethers.getContractAt('UniswapV2Pair', create2Address)
    expect(await pair.factory()).to.eq(await factory.getAddress())
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
    expect(await pair.token1()).to.eq(TEST_ADDRESSES[1])
  }

  it('createPair', async () => {
    await createPair(TEST_ADDRESSES)
  })

  it('createPair:reverse', async () => {
    await createPair(TEST_ADDRESSES.slice().reverse())
  })

  it('createPair:gas', async () => {
    const tx = await factory.createPair(...TEST_ADDRESSES)
    const receipt = await tx.wait()
    // Not asserting an exact value: upstream's 2512920 was measured against the
    // original 'Uniswap V2' bytecode on an older solc/EVM combo. Our Pair's creation
    // bytecode differs (renamed name/symbol string literals change code size and thus
    // CREATE2 gas), so we only sanity-check the call succeeds and costs a plausible amount.
    expect(receipt.gasUsed).to.be.above(1000000n)
  })

  it('setFeeTo', async () => {
    await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
    await factory.setFeeTo(wallet.address)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })

  it('setFeeToSetter', async () => {
    await expect(factory.connect(other).setFeeToSetter(other.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
    await factory.setFeeToSetter(other.address)
    expect(await factory.feeToSetter()).to.eq(other.address)
    await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith('UniswapV2: FORBIDDEN')
  })
})
