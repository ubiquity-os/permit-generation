import { RPCHandler, HandlerConstructorConfig } from "@ubiquity-dao/rpc-handler";
import { JsonRpcProvider } from "ethers";

function getHandler(networkId: number | string) {
  const config = {
    networkId,
    autoStorage: false,
    cacheRefreshCycles: 5,
    rpcTimeout: 1500,
    networkName: null,
    runtimeRpcs: null,
    networkRpcs: null,
  };

  return new RPCHandler(config as HandlerConstructorConfig);
}

export async function getFastestProvider(networkId: number | string): Promise<providers.JsonRpcProvider> {
  try {
    const handler = getHandler(networkId);
    const provider = await handler.getFastestRpcProvider();
    return new JsonRpcProvider(provider.connection.url);
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId}`);
  }
}
