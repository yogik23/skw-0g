import { ethers } from "ethers";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { 
  logError,
  logCache,
  logInfo,
  logSuccess,
  delay,
} from "./skw/logger.js";

import { 
  BTC_ADDRESS,
  ETH_ADDRESS,
  USDT_ADDRESS,
  SWAP_ROUTER,
  GAS_LIMIT,
  getTokenName,
  RandomAmount,
  erc20_abi,
  swap_abi,
  buildPath,
  cekbalance,
  mintToken,
  approve,
  generateSwapParams,
} from "./skw/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC = "https://evmrpc-testnet.0g.ai/";
const provider = new ethers.JsonRpcProvider(RPC);

const privateKeys = fs
  .readFileSync(path.join(__dirname, "privatekey.txt"), "utf-8")
  .split("\n")
  .map((k) => k.trim())  
  .filter((k) => k.length > 0);

async function allbalance(wallet) {
  try {
    const getBalance = await provider.getBalance(wallet.address);
    const Ogformatbalance = ethers.formatUnits(getBalance,18);
    const OgBalance = parseFloat(Ogformatbalance).toFixed(5);

    const btcformatbalance = cekbalance(wallet, BTC_ADDRESS);
    const btcBalance = parseFloat(btcformatbalance).toFixed(5);

    const ethformatbalance = cekbalance(wallet, ETH_ADDRESS);
    const ethBalance = parseFloat(ethformatbalance).toFixed(3);

    const usdtformatbalance = cekbalance(wallet, USDT_ADDRESS);
    const usdtBalance = parseFloat(usdtformatbalance).toFixed(2);

    logAccount(`Wallet: ${wallet.address}`);
    logInfo(`Balance ${OgBalance} 0g`);
    logInfo(`Balance ${btcBalance} BTC`);
    logInfo(`Balance ${ethBalance} ETH`);
    logInfo(`Balance ${usdtBalance} USDT\n`);
  } catch (err) {
    logError(`Error Cek AllBalance : ${err.message || err}\n`);
  }
}

async function mintAllToken(wallet) {
  await mintToken(wallet, USDT_ADDRESS);
  await delay(5000);

  await mintToken(wallet, ETH_ADDRESS);
  await delay(5000);

  await mintToken(wallet, BTC_ADDRESS);
}

async function swapbtc(wallet, tokenIn, tokenOut, amount) {
  try {
    const contract = new ethers.Contract(SWAP_ROUTER, swap_abi, wallet);
    const fee = 3000;
    const amountswap = ethers.parseUnits(amount, 18);
    const deadline = Math.floor(Date.now() / 1000) + 60;

    const path = buildPath({ 
      tokenIn: tokenIn, 
      fee: fee, 
      tokenOut: tokenOut 
    });

    logCache(`Swap ${amount} ${getTokenName(tokenIn)} ke ${getTokenName(tokenOut)}`);
    await approve(wallet, tokenIn, SWAP_ROUTER, amountswap);

    const param = {
      path: path,
      recipient: wallet.address,
      deadline: deadline,
      amountIn: amountswap,
      amountOutMinimum: 0n,
    }

    const tx = await contract.exactInput(param, { gasLimit: GAS_LIMIT });
    logInfo(`Tx swap ->> https://chainscan-galileo.0g.ai/tx/${tx.hash}`);

    await tx.wait();
    logSuccess(`Swap berhasil!\n`);
    await delay(5000);
  } catch (err) {
    logError(`Error during Swap : ${err.message || err}\n`);
  }
}

async function swap(wallet) {
  try {
    const contract = new ethers.Contract(SWAP_ROUTER, swap_abi, wallet);
    const swapParams = generateSwapParams(wallet);
    for (const param of swapParams) {
      const amountswap = ethers.formatUnits(param.amountIn, 18);
      logCache(`Swap ${amountswap} ${getTokenName(param.tokenIn)} ke ${getTokenName(param.tokenOut)}`);
      await approve(wallet, param.tokenIn, SWAP_ROUTER, param.amountIn);

      const tx = await contract.exactInputSingle(param, { gasLimit: GAS_LIMIT });
      logInfo(`Tx dikirim ->> https://chainscan-galileo.0g.ai/tx/${tx.hash}`);
      await tx.wait();
      logSuccess(`Swap berhasil!\n`);
      await delay(7000);
    }

    const randombtceth = RandomAmount(0.0001, 0.0007, 4);
    await swapbtc(wallet, BTC_ADDRESS, ETH_ADDRESS, randombtceth);
    await delay(7000);

    const randombtcusdt = RandomAmount(0.0001, 0.0007, 4);
    await swapbtc(wallet, BTC_ADDRESS, USDT_ADDRESS, randombtcusdt);
  } catch (err) {
    logError(`Error during Swap : ${err.message || err}\n`);
  }
}

async function main() {
  try {
    console.clear();
    for (const pk of privateKeys) {
      const wallet = new ethers.Wallet(pk, provider);
      await allbalance(wallet);

      await mintAllToken(wallet);
      await delay(5000);

      await swap(wallet);
      await delay(7000);
    }
  } catch (err) {
    logError(`Error : ${err.message || err}\n`);
  }
}

main();
