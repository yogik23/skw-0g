import { ethers } from "ethers";
import { 
  logAccount,
  logError,
  logCache,
  logInfo,
  logSuccess,
  delay,
} from "./logger.js";

export const ca_swap = "0xE71Af6EEd736bA513CbD19Ebc82D1Cf943b80b63";
export const ca_routerv3 = "0x86fBDc47994966e14d8BA13f9ED546189641dF71";
export const ca_approve = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
export const usdc_address = "0x1AfB500AFfBBc8a7FC8aB0f5C4D06c59AC87B111";
export const usdt_address = "0x87054392461F52a513d83EF2e06af50f4e2F6614";
export const wHAUST_address = "0x6C25C1Cb4b8677982791328471be1bFB187687c1";

export const abi_swap =["function execute(bytes commands, bytes[] inputs, uint256 deadline) payable"];

export const erc20Abi = [
  "function approve(address guy, uint256 wad) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export export function randomAmount(min, max, decimalPlaces) {
  return (Math.random() * (max - min) + min).toFixed(decimalPlaces);
}

export export function randomdelay(min = 7000, max = 15000) {
  return Math.floor(Math.random() * (max - min) + min);
}

export async function approve1(wallet, amount) {
  const token = new ethers.Contract(wHAUST_address, erc20Abi, wallet);
  const parsedAmount = ethers.parseUnits(amount, 18);

  const allowance = await token.allowance(wallet.address, ca_approve);
  if (allowance >= parsedAmount) {
    return;
  }

  logCache(`Approving tokens...`);

  try {
    const tx = await token.approve(ca_approve, ethers.MaxUint256);
    logInfo(`Tx Dikirim https://explorer-testnet.haust.app/tx/${tx.hash}`);
    await tx.wait();
    logSuccess(`Approve successful\n`);
  } catch (err) {
    logError(`Error during Approve : ${err.message || err}`);
  }
}

export async function approve2(wallet, tokenAddress, spenderAddress, amount, decimals, expirationTimestamp) {
  const approve_abi = ["function approve(address token, address spender, uint160 amount, uint48 expiration) external"];
  const contract = new ethers.Contract(ca_approve, approve_abi, wallet);
  const parsedAmount = ethers.parseUnits(amount, decimals);

  logCache(`Mengirim Approve...`);

  try {
    const tx = await contract.approve(tokenAddress, spenderAddress, parsedAmount, expirationTimestamp);
    logInfo(`Tx Dikirim https://explorer-testnet.haust.app/tx/${tx.hash}`);
    await tx.wait();
    logSuccess(`Approve Berhasil`);
  } catch (err) {
    logError(`Error during Approve : ${err.message || err}`);
  }
}
