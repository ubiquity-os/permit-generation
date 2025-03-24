import { ethers } from "ethers";
import { logger } from "../../helpers/logger";

export async function getTokenDecimals(tokenAddress: string, provider: ethers.providers.Provider) {
  try {
    const erc20Abi = ["function decimals() public view returns (uint8)"];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    return await tokenContract.decimals();
  } catch (err) {
    throw logger.error(`Failed to get token decimals for token: ${tokenAddress}`, { err });
  }
}
