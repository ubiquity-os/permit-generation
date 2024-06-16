import { RPCHandler, HandlerConstructorConfig } from "@ubiquity-dao/rpc-handler"
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

  return new RPCHandler(config as HandlerConstructorConfig)
}

export async function getFastestProvider(networkId: number | string): Promise<JsonRpcProvider> {
  const handler = getHandler(networkId)
  return await handler.getFastestRpcProvider()
}