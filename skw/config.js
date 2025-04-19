const { ethers } = require('ethers');
const ora = require('ora');

const BTC_ADDRESS = "0x1e0d871472973c562650e991ed8006549f8cbefc";
const ETH_ADDRESS = "0xce830d0905e0f7a9b300401729761579c5fb6bd6";
const USDT_ADDRESS = "0x9a87c2412d500343c073e5ae5394e3be3874f76b";
const ROUTER = "0xE233D75Ce6f04C04610947188DEC7C55790beF3b";
const GAS_LIMIT = 500000;

const mint_abi = [ "function mint() public" ];
const swap_abi = [ "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) payable returns (uint256)" ];
const ERC20_ABI = [ "function approve(address spender, uint256 amount) external returns (bool)", "function allowance(address owner, address spender) view returns (uint256)" ];
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function generateSwapParams(wallet) {
  return {
    USDT: [
      {
        tokenIn: USDT_ADDRESS, tokenOut: ETH_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("10", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      },
      {
        tokenIn: USDT_ADDRESS, tokenOut: BTC_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("10", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      }
    ],
    ETH: [
      {
        tokenIn: ETH_ADDRESS, tokenOut: USDT_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("0.01", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      },
      {
        tokenIn: ETH_ADDRESS, tokenOut: BTC_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("0.01", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      }
    ],
    BTC: [
      {
        tokenIn: BTC_ADDRESS, tokenOut: ETH_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("0.0001", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      },
      {
        tokenIn: BTC_ADDRESS, tokenOut: USDT_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("0.0001", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      }
    ]
  };
}

async function spinnerCD(seconds) {
    const spinner = ora().start();

    return new Promise((resolve) => {
        let countdown = seconds;
        const countdownInterval = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                spinner.succeed();
                resolve();
            } else {
                spinner.text = chalk.cyan(`${countdown} detik...`);
                countdown--;
            }
        }, 1000);
    });
}

const spinner = ora({
  color: "cyan",
});

module.exports = {
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
};
