import { RpcHandler } from "./rpc-handler";
import { JsonRpcProvider } from "@ethersproject/providers";

export async function getFastestProvider(networkId: number): Promise<JsonRpcProvider> {
  try {
    const handler = new RpcHandler();
    const rpcUrl = await handler.getFastestRpcUrl(networkId);
    return new JsonRpcProvider(rpcUrl);
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId}`);
  }
}
