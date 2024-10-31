import { RPCHandler, HandlerConstructorConfig, NetworkId } from "@ubiquity-dao/rpc-handler";
import { providers } from "ethers";
import { logger } from "../helpers/logger";

function getHandler(networkId: number | string) {
  const config: HandlerConstructorConfig = {
    networkId: String(networkId) as NetworkId,
    autoStorage: false,
    cacheRefreshCycles: 5,
    rpcTimeout: 1500,
    networkName: null,
    runtimeRpcs: process.env.NODE_ENV === "development" ? ["http://localhost:8545"] : null,
    networkRpcs: process.env.NODE_ENV === "development" ? [{ url: "http://localhost:8545" }] : null,
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
  let provider;
  try {
    const handler = getHandler(networkId);
    provider = await handler.getFastestRpcProvider();
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId} - ${String(e)}`);
  }

  if (!provider) {
    logger.error("Provider is not defined");
    throw new Error("Provider is not defined");
  }

  return provider;
}
