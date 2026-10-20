pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    // Wrapped native token (WNGRX). Every pair must include it unless whitelisted by admin.
    address public wngrx;
    address public admin;
    // Whitelist for pairs that do not include WNGRX, keyed by sorted (token0, token1)
    mapping(address => mapping(address => bool)) public allowedPair;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    event PairAllowedSet(address indexed token0, address indexed token1, bool allowed);
    event AdminSet(address indexed admin);

    constructor(address _feeToSetter, address _wngrx, address _admin) public {
        require(_wngrx != address(0) && _admin != address(0), 'UniswapV2: ZERO_ADDRESS');
        feeToSetter = _feeToSetter;
        wngrx = _wngrx;
        admin = _admin;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(
            token0 == wngrx || token1 == wngrx || allowedPair[token0][token1],
            'UniswapV2: PAIR_NOT_ALLOWED'
        );
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setPairAllowed(address tokenA, address tokenB, bool allowed) external {
        require(msg.sender == admin, 'UniswapV2: FORBIDDEN');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        allowedPair[token0][token1] = allowed;
        emit PairAllowedSet(token0, token1, allowed);
    }

    function setAdmin(address _admin) external {
        require(msg.sender == admin, 'UniswapV2: FORBIDDEN');
        require(_admin != address(0), 'UniswapV2: ZERO_ADDRESS');
        admin = _admin;
        emit AdminSet(_admin);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
