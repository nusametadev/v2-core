require('@nomicfoundation/hardhat-toolbox')

// Compiler settings must match the original waffle.json exactly:
// the UniswapV2Pair creation bytecode (and thus INIT_CODE_HASH in v2-periphery) depends on them.
module.exports = {
  solidity: {
    version: '0.5.16',
    settings: {
      evmVersion: 'istanbul',
      optimizer: { enabled: true, runs: 999999 }
    }
  }
}
