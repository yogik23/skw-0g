const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { ethers } = require("ethers");
const chalk = require("chalk");
const { displayskw } = require('./skw/displayskw');

const {
  BTC_ADDRESS,
  ETH_ADDRESS,
  USDT_ADDRESS,
  ROUTER,
  GAS_LIMIT,
  mint_abi,
  swap_abi,
  ERC20_ABI,
  delay,
  generateSwapParams,
  spinnerCD,
  spinner
} = require('./skw/config');

const RPC = "https://evmrpc-testnet.0g.ai";
const provider = new ethers.JsonRpcProvider(RPC);

const privateKeys = fs.readFileSync(path.join(__dirname, "privatekey.txt"), "utf-8")
  .split("\n")
  .map(k => k.trim())
  .filter(k => k.length > 0);

async function waitForSuccess(txHash) {
  const explorerUrl = `https://chainscan-newton.0g.ai/v1/transaction/${txHash}`;
  try {
    spinner.start(chalk.hex('#3CB371')(` Mengirim Transaksi ke Blockchain...`));
    await delay(30000);

    const res = await axios.get(explorerUrl);

    if (res.data?.result?.outcomeStatus === 0) {
      spinner.succeed(chalk.hex('#3CB371')(` Transaksi Berhasil!\n⛓️ https://chainscan-newton.0g.ai/tx/${txHash}\n`));
      return;
    } else {
      spinner.stop();
      console.log(chalk.hex('#FFD700')(`❌ Transaksi Gagal atau Masih Pending\n⛓️ https://chainscan-newton.0g.ai/tx/${txHash}\n`));
    }

  } catch (err) {
    spinner.fail(chalk.hex('#FF4500')(` Error fetching TX: ${err.message}\n`));
  }

}

async function mintToken(wallet) {
  try {
    const mintBTC = new ethers.Contract(BTC_ADDRESS, mint_abi, wallet);
    const mintETH = new ethers.Contract(ETH_ADDRESS, mint_abi, wallet);
    const mintUSDT = new ethers.Contract(USDT_ADDRESS, mint_abi, wallet);

    console.log("Minting BTC...");
    let tx = await mintBTC.mint();
    console.log("TX:", tx.hash);
    await waitForSuccess(tx.hash);

    console.log("Minting ETH...");
    tx = await mintETH.mint();
    console.log("TX:", tx.hash);
    await waitForSuccess(tx.hash);

    console.log("Minting USDT...");
    tx = await mintUSDT.mint();
    console.log("TX:", tx.hash);
    await waitForSuccess(tx.hash);

    console.log("✅ Semua mint berhasil!\n");
  } catch (err) {
    console.error("❌ Mint gagal:", err.message);
  }
}

async function swap(wallet, params) {
  const contract = new ethers.Contract(ROUTER, swap_abi, wallet);
  const gasPrice = ethers.parseUnits("10", "gwei");

  const tokenIn = params.tokenIn === USDT_ADDRESS ? "USDT" :
                  params.tokenIn === ETH_ADDRESS ? "ETH" : "BTC";
  const tokenOut = params.tokenOut === USDT_ADDRESS ? "USDT" :
                   params.tokenOut === ETH_ADDRESS ? "ETH" : "BTC";

  console.log(chalk.hex('#00CED1')(`🔁 Swapping ${ethers.formatUnits(params.amountIn, 18)} ${tokenIn} → ${tokenOut}`));
  try {
    const tx = await contract.exactInputSingle(params, { gasLimit: GAS_LIMIT, gasPrice });
    await waitForSuccess(tx.hash);
  } catch (err) {
    console.error("❌ Swap failed:", err.reason || err.message);
  }
}

async function approveIfNeeded(wallet, tokenAddress, amountIn) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const allowance = await token.allowance(wallet.address, ROUTER);
  if (allowance < amountIn) {
    console.log(`🔓 Approving ${tokenAddress}...`);
    const tx = await token.approve(ROUTER, ethers.MaxUint256);
    await spinnerCD(10);
    await waitForSuccess(tx.hash);
  }
}

async function runSwaps(wallet, swapParams) {
  for (const param of swapParams) {
    await approveIfNeeded(wallet, param.tokenIn, param.amountIn);
    await swap(wallet, param);
    await spinnerCD(10);
  }
}

async function main() {
  console.clear();
  displayskw();
  for (const privateKey of privateKeys) {
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(chalk.cyan(`🔑 Wallet: ${wallet.address}\n`));

    const params = generateSwapParams(wallet);

    await runSwaps(wallet, params.USDT);
    await runSwaps(wallet, params.ETH);
    await runSwaps(wallet, params.BTC);

    console.log(chalk.green(`✅ Selesai untuk wallet: ${wallet.address}\n\n`));
    await delay(3000);
  }
}

main();
