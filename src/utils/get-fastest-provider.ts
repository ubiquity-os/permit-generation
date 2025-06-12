import { ethers, providers } from "ethers";

export async function getRpcProvider(networkId: number | string): Promise<providers.JsonRpcProvider> {
  try {
    return new ethers.providers.JsonRpcProvider(`https://rpc.ubq.fi/${networkId}`);
  } catch (e) {
    throw new Error(`Failed to get provider for networkId: ${networkId}`);
  }
}
