import { ethers } from "ethers";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";

export async function getTokenDecimals(tokenAddress: string, provider: ethers.providers.Provider, logger: Logs) {
    try {
        const erc20Abi = ["function decimals() public view returns (uint8)"];
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
        return await tokenContract.decimals();
    } catch (err) {
        const errorMessage = `Failed to get token decimals for token: ${tokenAddress}, ${err}`;
        logger.debug(errorMessage, { err });
        throw new Error(errorMessage);
    }
}