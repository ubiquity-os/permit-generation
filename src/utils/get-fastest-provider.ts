import { ethers, providers } from "ethers";

export async function getRpcProvider(networkId: number | string): Promise<providers.JsonRpcProvider> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(`https://rpc.ubq.fi/${networkId}`);
    // We make one call to make sure our provider is responding
    await provider.getBlockNumber();
    return provider;
  } catch (e) {
    throw new Error(`Failed to get provider for networkId: ${networkId}`);
  }
}
