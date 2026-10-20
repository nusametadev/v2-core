require('@nomicfoundation/hardhat-toolbox')

// Compiler settings must match the original waffle.json exactly:
// the UniswapV2Pair creation bytecode (and thus INIT_CODE_HASH in v2-periphery) depends on them.
//
// NOTE: solc 0.5.16 does not support settings.metadata.bytecodeHash (added in 0.6.0), so
// the default "ipfs" metadata mode applies here, and the resulting creation bytecode's
// trailing metadata bytes are a function of the source file paths solc sees (e.g.
// "contracts/UniswapV2Pair.sol" relative to THIS repo's root). v2-periphery must use the
// precompiled artifacts from this repo's own `artifacts/` directly (vendored, not
// recompiled via a node_modules symlink) to get byte-identical Factory/Pair bytecode and
// therefore a matching INIT_CODE_HASH. See v2-periphery/README.md "Nagara deployment".
module.exports = {
  solidity: {
    version: '0.5.16',
    settings: {
      evmVersion: 'istanbul',
      optimizer: { enabled: true, runs: 999999 }
    }
  }
}
