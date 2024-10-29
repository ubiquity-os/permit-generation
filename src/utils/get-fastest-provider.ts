import { RPCHandler, HandlerConstructorConfig } from "@ubiquity-dao/rpc-handler";
import { providers } from "ethers";

function getHandler(networkId: number | string) {
  const config = {
    networkId,
    autoStorage: false,
    cacheRefreshCycles: 5,
    rpcTimeout: 1500,
    networkName: null,
    runtimeRpcs: null,
    networkRpcs: null,
    proxySettings: {
      retryCount: 5,
    },
  };

  return new RPCHandler(config as HandlerConstructorConfig);
}

export async function getFastestProvider(networkId: number | string): Promise<providers.JsonRpcProvider> {
  try {
    const handler = getHandler(networkId);
    return await handler.getFastestRpcProvider();
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId} - ${String(e)}`);
  }
}
