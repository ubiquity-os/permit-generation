// available tokens for payouts
export const PAYMENT_TOKEN_PER_NETWORK: Record<string, { rpc: string; token: string }> = {
  "1": {
    rpc: "https://rpc-bot.ubq.fi/v1/mainnet",
    token: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
  },
  "100": {
    rpc: "https://rpc.gnosischain.com",
    token: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // WXDAI
  },
  "31337": {
    rpc: "http://localhost:8545",
    token: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // WXDAI
  },
};

export function getPayoutConfigByNetworkId(evmNetworkId: number) {
  const paymentToken = PAYMENT_TOKEN_PER_NETWORK[evmNetworkId.toString()];
  if (!paymentToken) {
    throw new Error(`No config setup for evmNetworkId: ${evmNetworkId}`);
  }

  return {
    rpc: paymentToken.rpc,
    paymentToken: paymentToken.token,
  };
}
