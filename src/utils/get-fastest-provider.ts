import { RPCHandler, HandlerConstructorConfig, NetworkId } from "@ubiquity-dao/rpc-handler";
import { providers } from "ethers";

function getHandler(networkId: number | string) {
  const config: HandlerConstructorConfig = {
    networkId: String(networkId) as NetworkId,
    autoStorage: false,
    cacheRefreshCycles: 5,
    rpcTimeout: 150000,
    networkName: null,
    runtimeRpcs: networkId == 31337 ? ["http://localhost:8545"] : [],
    networkRpcs: networkId == 31337 ? [{ url: "http://localhost:8545" }] : [],
    proxySettings: {
      retryCount: 5,
      logger: null,
      logTier: "info",
      retryDelay: 1000,
      strictLogs: false,
      disabled: false,
      moduleName: "rpc-handler",
    },
  };

  return new RPCHandler(config);
}

export async function getFastestProvider(networkId: number | string): Promise<providers.JsonRpcProvider> {
  try {
    const handler = getHandler(networkId);
    return await handler.getFastestRpcProvider();
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId}`);
  }
}
