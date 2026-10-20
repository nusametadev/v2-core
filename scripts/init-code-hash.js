// Prints keccak256 of the UniswapV2Pair creation bytecode.
// This value must be set as the init code hash in v2-periphery's UniswapV2Library.pairFor().
const { artifacts, ethers } = require('hardhat')

async function main() {
  const { bytecode } = await artifacts.readArtifact('UniswapV2Pair')
  console.log(ethers.keccak256(bytecode))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
