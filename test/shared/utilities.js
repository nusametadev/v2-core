const { ethers, network } = require('hardhat')

const PERMIT_TYPEHASH = ethers.keccak256(
  ethers.toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

function expandTo18Decimals(n) {
  return BigInt(n) * 10n ** 18n
}

function getDomainSeparator(name, tokenAddress, chainId) {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        ethers.keccak256(
          ethers.toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
        ),
        ethers.keccak256(ethers.toUtf8Bytes(name)),
        ethers.keccak256(ethers.toUtf8Bytes('1')),
        chainId,
        tokenAddress
      ]
    )
  )
}

function getCreate2Address(factoryAddress, [tokenA, tokenB], bytecode) {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
  return ethers.getCreate2Address(
    factoryAddress,
    ethers.solidityPackedKeccak256(['address', 'address'], [token0, token1]),
    ethers.keccak256(bytecode)
  )
}

async function getApprovalDigest(token, approve, nonce, deadline) {
  const name = await token.name()
  const DOMAIN_SEPARATOR = getDomainSeparator(name, await token.getAddress(), network.config.chainId)
  return ethers.solidityPackedKeccak256(
    ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
    [
      '0x19',
      '0x01',
      DOMAIN_SEPARATOR,
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
          [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
        )
      )
    ]
  )
}

function encodePrice(reserve0, reserve1) {
  return [(reserve1 * 2n ** 112n) / reserve0, (reserve0 * 2n ** 112n) / reserve1]
}

module.exports = { expandTo18Decimals, getDomainSeparator, getCreate2Address, getApprovalDigest, encodePrice }
