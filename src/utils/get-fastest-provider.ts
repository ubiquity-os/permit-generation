import { RPCHandler, HandlerConstructorConfig } from "@ubiquity-dao/rpc-handler";
import { Provider } from "ethers";

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

export async function getFastestProvider(networkId: number | string): Promise<Provider> {
  try {
    const handler = getHandler(networkId);
    const provider = await handler.getFastestRpcProvider();
    return provider as unknown as Provider;
  } catch (e) {
    throw new Error(`Failed to get fastest provider for networkId: ${networkId}`);
  }
}
