import { ethers } from "ethers";
import chalk from "chalk";
import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { displayskw } from './skw/displayskw.js';
dotenv.config();
import { 
  logAccount,
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
  ca_onChainGM,
  data_onChainGM,
  gm_topic,
  GAS_LIMIT,
  getTokenName,
  RandomAmount,
  randomdelay,
  erc20_abi,
  swap_abi,
  buildPath,
  cekbalance,
  mintToken,
  onChainGM,
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

    const btcformatbalance = await cekbalance(wallet, BTC_ADDRESS);
    const btcBalance = parseFloat(btcformatbalance).toFixed(5);

    const ethformatbalance = await cekbalance(wallet, ETH_ADDRESS);
    const ethBalance = parseFloat(ethformatbalance).toFixed(3);

    const usdtformatbalance = await cekbalance(wallet, USDT_ADDRESS);
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
  await delay(randomdelay());

  await mintToken(wallet, ETH_ADDRESS);
  await delay(randomdelay());

  await mintToken(wallet, BTC_ADDRESS);
}

async function allGM(wallet) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);
    const toBlock = currentBlock;

    const filter = {
      address: ca_onChainGM,
      topics: [gm_topic, ethers.zeroPadValue(wallet.address, 32)],
      fromBlock,
      toBlock,
    };
  
    const logs = await provider.getLogs(filter);
    if (logs.length == 0) {
      await onChainGM(wallet);
      return true;
    }

    const lastBlock = logs[logs.length - 1].blockNumber;
    const block = await provider.getBlock(lastBlock);
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - block.timestamp;

    if (elapsed < 86400) {
      const cooldownLeft = 86400 - elapsed;
      logCache(`onChainGM Masih cooldown ${Math.floor(cooldownLeft/3600)} jam ${Math.floor((cooldownLeft%3600)/60)} menit\n`); 
    } else {
      await onChainGM(wallet);
    }

  } catch (error) {
    console.error(error);
    return null;
  }
}

async function swapETHBTC(wallet, tokenIn, tokenOut, amount) {
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
    
    logAccount(`Wallet: ${wallet.address}`);
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
    await delay(randomdelay());
  } catch (err) {
    logError(`Error during Swap : ${err.message || err}\n`);
  }
}

async function swapUSDTETH(wallet) {
  try {
    const contract = new ethers.Contract(SWAP_ROUTER, swap_abi, wallet);
    const swapParams = generateSwapParams(wallet);
    for (const param of swapParams) {
      const amountswap = ethers.formatUnits(param.amountIn, 18);
      logAccount(`Wallet: ${wallet.address}`);
      logCache(`Swap ${amountswap} ${getTokenName(param.tokenIn)} ke ${getTokenName(param.tokenOut)}`);
      
      await approve(wallet, param.tokenIn, SWAP_ROUTER, param.amountIn);

      const tx = await contract.exactInputSingle(param, { gasLimit: GAS_LIMIT });
      logInfo(`Tx dikirim ->> https://chainscan-galileo.0g.ai/tx/${tx.hash}`);
      await tx.wait();
      logSuccess(`Swap berhasil!\n`);
      await delay(randomdelay());
    }
  } catch (err) {
    logError(`Error during Swap : ${err.message || err}\n`);
  }
}

async function allswap(wallet) {
  try {
    await swapUSDTETH(wallet);

    const randomethbtc = RandomAmount(0.1, 1, 1);
    await swapETHBTC(wallet, ETH_ADDRESS, BTC_ADDRESS, randomethbtc);
    await delay(randomdelay());

    const randombtceth = RandomAmount(0.0001, 0.0007, 4);
    await swapETHBTC(wallet, BTC_ADDRESS, ETH_ADDRESS, randombtceth);
    await delay(randomdelay());

    const randombtcusdt = RandomAmount(0.0001, 0.0007, 4);
    await swapETHBTC(wallet, BTC_ADDRESS, USDT_ADDRESS, randombtcusdt);
  } catch (err) {
    logError(`Error during Swap : ${err.message || err}\n`);
  }
}

async function sendTG(address, txCount) {
  if (process.env.SEND_TO_TG !== "true") {
    return;
  }

  const retries = 5;
  const date = new Date().toISOString().split("T")[0];
  const escape = (text) => text.toString().replace(/([_*[\]()~`>#+-=|{}.!])/g, "\\$1");

  const message = `🌐 *0g Testnet*\n📅 *${escape(date)}*\n👛 *${escape(address)}*\n🔣 *Total TX: ${escape(txCount)}*`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: process.env.CHAT_ID,
          text: message,
          parse_mode: "MarkdownV2",
        }
      );
      logSuccess(`Message sent to Telegram successfully!\n`);
      return response.data;
    } catch (error) {
      logError(`Error sendTG : ${error.message || error}\n`);
      if (attempt < retries) {
        await delay(3000); 
      } else {
        return null;
      }
    }
  }
}

async function startBot() {
  try {
    displayskw();
    await delay(6000);
    console.clear();
    for (const pk of privateKeys) {
      const wallet = new ethers.Wallet(pk, provider);
      await allbalance(wallet);

      await allGM(wallet);
      await delay(randomdelay());

      await mintAllToken(wallet);
      await delay(randomdelay());

      await allswap(wallet);
      await delay(randomdelay());

      const txCount = await provider.getTransactionCount(wallet.address);
      logAccount(`Totaltx ${wallet.address}`);
      logAccount(`-->>>: ${txCount}`);
      await sendTG(wallet.address, txCount);
      await delay(randomdelay());
    }
  } catch (err) {
    logError(`Error : ${err.message || err}\n`);
  }
}

async function main() {
  const date = new Date().toISOString().split('T')[0];
  cron.schedule('0 1 * * *', async () => { 
    await startBot();
    console.log();
    console.log(chalk.hex('#FF00FF')(`${date} Cron AKTIF`));
    console.log(chalk.hex('#FF1493')('Besok Jam 08:00 WIB Autobot Akan Run'));
  });

  await startBot();
  console.log();
  console.log(chalk.hex('#FF00FF')(`${date} Cron AKTIF`));
  console.log(chalk.hex('#FF1493')('Besok Jam 08:00 WIB Autobot Akan Run'));
}

main();
