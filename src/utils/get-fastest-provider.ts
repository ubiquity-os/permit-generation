import { RPCHandler, HandlerConstructorConfig, NetworkId } from "@ubiquity-dao/rpc-handler";
import { providers } from "ethers";
import { logger } from "../helpers/logger";

export function getHandler(networkId: number | string) {
  const config: HandlerConstructorConfig = {
    networkId: String(networkId) as NetworkId,
    autoStorage: false,
    cacheRefreshCycles: 5,
    rpcTimeout: 1500,
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
  let provider;
  try {
    const handler = getHandler(networkId);
    provider = await handler.getFastestRpcProvider();
  } catch (e) {
    throw logger.error(`[getFastestProvider] - Failed to get fastest provider`, { e, networkId });
  }

  if (!provider) {
    throw logger.error("[getFastestProvider] - Provider is not defined");
  }

  return provider;
}
