// available tokens for payouts
export const PAYMENT_TOKEN_PER_NETWORK: Record<string, { rpc: string; }> = {
  "1": {
    rpc: "https://rpc.mevblocker.io",
  },
  "100": {
    rpc: "https://rpc.gnosis.gateway.fm",
  },
  "31337": {
    rpc: "http://localhost:8545",
  },
};

export function getPayoutConfigByNetworkId(evmNetworkId: number) {
  const paymentToken = PAYMENT_TOKEN_PER_NETWORK[evmNetworkId.toString()];
  if (!paymentToken) {
    throw new Error(`No config setup for evmNetworkId: ${evmNetworkId}`);
  }

  return paymentToken;
}
