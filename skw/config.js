import { ethers } from "ethers";
import { 
  logAccount,
  logError,
  logCache,
  logInfo,
  logSuccess,
  delay,
} from "./logger.js";

export const BTC_ADDRESS = "0x36f6414FF1df609214dDAbA71c84f18bcf00F67d";
export const ETH_ADDRESS = "0x0fE9B43625fA7EdD663aDcEC0728DD635e4AbF7c";
export const USDT_ADDRESS = "0x3eC8A8705bE1D5ca90066b37ba62c4183B024ebf";
export const SWAP_ROUTER = "0xb95B5953FF8ee5D5d9818CdbEfE363ff2191318c";
export const GAS_LIMIT = 200000;

export const tokenNames = {
  [USDT_ADDRESS.toLowerCase()]: "USDT",
  [ETH_ADDRESS.toLowerCase()]: "ETH",
  [BTC_ADDRESS.toLowerCase()]: "BTC",
};

export function getTokenName(address) {
  return tokenNames[address.toLowerCase()] ?? address;
}

export const erc20_abi = [
  "function approve(address spender, uint256 amount) external returns (bool)", 
  "function allowance(address owner, address spender) view returns (uint256)", 
  "function balanceOf(address owner) view returns (uint256)", 
];

export const swap_abi = [
  "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) payable returns (uint256 amountOut)",  
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96 )) payable returns (uint256)",  
]

export function RandomAmount(min, max, decimalPlaces) {
  return (Math.random() * (max - min) + min).toFixed(decimalPlaces);
}

export function randomdelay(min = 7000, max = 15000) {
  return Math.floor(Math.random() * (max - min) + min);
}

export function buildPath({ tokenIn, fee, tokenOut }) {
  return ethers.concat([
    tokenIn,
    ethers.zeroPadValue(ethers.toBeHex(fee), 3),
    tokenOut,
  ]);
}

export async function cekbalance(wallet, tokenIn) {
  try {
    const contract = new ethers.Contract(tokenIn, erc20_abi, wallet);
    const balancewei = await contract.balanceOf(wallet.address);
    const formatbalance = ethers.formatUnits(balancewei,18);
    return formatbalance;
  } catch (err) {
    logError(`Error Cek Balance : ${err.message || err}\n`);
  }
}

export async function mintToken(wallet, tokenmint) {
  try {
    const mint_abi = ["function mint() public"];
    const contract = new ethers.Contract(tokenmint, mint_abi, wallet);

    logCache(`Claim Faucet ${getTokenName(tokenmint)}`);
    const tx = await contract.mint();
    logInfo(`Tx Claim ->> https://chainscan-galileo.0g.ai/tx/${tx.hash}`);

    let attempts = 0;
    while (attempts < 5) {
      try {
        await tx.wait();
        break;
      } catch (err) {
        if (err.message?.includes("Too many requests")) {
          attempts++;
          await delay(2000);
        } else {
          throw err;
        }
      }
    }

    if (attempts == 5) {
      logError(`Gagal claim, rate limit`);
    } else {
      logSuccess(`Claim berhasil!\n`);
    }

  } catch (err) {
    logError(`Error Claim Faucet : ${err.message || err}\n`);
  }
}

export async function approve(wallet, tokenAddress, spenderAddress, amountIn) {
  try {
    const token = new ethers.Contract(tokenAddress, erc20_abi, wallet);
    const allowance = await token.allowance(wallet.address, spenderAddress);
    if (allowance >= amountIn) {
      return;
    }
    logInfo(`Approve dahulu sebelum swap`);

    const tx = await token.approve(spenderAddress, amountIn);
    logInfo(`Tx Approve ->> https://chainscan-galileo.0g.ai/tx/${tx.hash}`);

    await tx.wait();
    logSuccess(`Approve sukses!`);
    logCache(`Lanjut ke Swap`);

  } catch (err) {
    logError(`Error Approve : ${err.message || err}\n`);
  }
}

export function generateSwapParams(wallet) {
  return [
    {
      tokenIn: USDT_ADDRESS,
      tokenOut: ETH_ADDRESS,
      fee: 3000,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60,
      amountIn: ethers.parseUnits(RandomAmount(50, 500, 0), 18),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    },
    {
      tokenIn: USDT_ADDRESS,
      tokenOut: BTC_ADDRESS,
      fee: 3000,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60,
      amountIn: ethers.parseUnits(RandomAmount(50, 500, 0), 18),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    },
    {
      tokenIn: ETH_ADDRESS,
      tokenOut: USDT_ADDRESS,
      fee: 3000,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 60,
      amountIn: ethers.parseUnits(RandomAmount(0.1, 0.5, 2), 18),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    },
  ]
}
