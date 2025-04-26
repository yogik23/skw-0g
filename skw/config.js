const { ethers } = require('ethers');
const ora = require('ora');
const chalk = require('chalk');

const BTC_ADDRESS = "0x6dc29491a8396bd52376b4f6da1f3e889c16ca85";
const ETH_ADDRESS = "0x2619090fcfdb99a8ccf51c76c9467f7375040eeb";
const USDT_ADDRESS = "0xa8f030218d7c26869cadd46c5f10129e635cd565";
const ROUTER = "0x16a811adc55a99b4456f62c54f12d3561559a268";
const GAS_LIMIT = 200000;

const mint_abi = ["function mint() public"];

const swap_abi = [
  `function exactInputSingle(
    (address tokenIn, address tokenOut, uint24 fee, address recipient,
    uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params
  ) payable returns (uint256)`
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function generateSwapParams(wallet) {
  return {
    USDT: [
      {
        tokenIn: USDT_ADDRESS, tokenOut: ETH_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("50", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
      },
      {
        tokenIn: USDT_ADDRESS, tokenOut: BTC_ADDRESS, fee: 3000, recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60,
        amountIn: ethers.parseUnits("70", 18), amountOutMinimum: 0, sqrtPriceLimitX96: 0n
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
