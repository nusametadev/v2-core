const { expect } = require('chai')
const { ethers, network } = require('hardhat')
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

const { expandTo18Decimals, getDomainSeparator, getApprovalDigest } = require('./shared/utilities')

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)

describe('UniswapV2ERC20', () => {
  async function tokenFixture() {
    const [wallet, other] = await ethers.getSigners()
    const token = await ethers.deployContract('ERC20', [TOTAL_SUPPLY])
    return { wallet, other, token }
  }

  let wallet, other, token
  beforeEach(async () => {
    ;({ wallet, other, token } = await loadFixture(tokenFixture))
  })

  it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
    const name = await token.name()
    expect(name).to.eq('Nagara LP')
    expect(await token.symbol()).to.eq('NGR-LP')
    expect(await token.decimals()).to.eq(18)
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
    expect(await token.DOMAIN_SEPARATOR()).to.eq(
      getDomainSeparator(name, await token.getAddress(), network.config.chainId)
    )
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      ethers.keccak256(
        ethers.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
      )
    )
  })

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY - TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer:fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY + 1n)).to.be.reverted // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
  })

  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY - TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transferFrom:max', async () => {
    await token.approve(other.address, ethers.MaxUint256)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(ethers.MaxUint256)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY - TEST_AMOUNT)
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('permit', async () => {
    const nonce = await token.nonces(wallet.address)
    const deadline = ethers.MaxUint256
    const digest = await getApprovalDigest(
      token,
      { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
      nonce,
      deadline
    )

    // Hardhat's default accounts are derived from the well-known test mnemonic.
    const accounts = network.config.accounts
    const signingKey = ethers.HDNodeWallet.fromPhrase(accounts.mnemonic, undefined, `${accounts.path}/0`).signingKey
    const { v, r, s } = signingKey.sign(digest)

    await expect(token.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, r, s))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    expect(await token.nonces(wallet.address)).to.eq(1)
  })
})
