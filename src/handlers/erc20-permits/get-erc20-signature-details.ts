import { PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer, MaxUint256 } from "@uniswap/permit2-sdk";
import { utils } from "ethers";
import { getFastestProvider } from "../../utils/get-fastest-provider";
import { getAdminWallet, getPrivateKey } from "../../helpers/signer";
import { getTokenDecimals } from "./get-token-decimals";
import { logger } from "../../helpers/logger";

export async function getPermitSignatureDetails({
  walletAddress,
  nonce,
  evmNetworkId,
  evmPrivateEncrypted,
  userId,
  tokenAddress,
  amount,
  x25519privateKey,
}: {
  walletAddress: string | null | undefined;
  nonce: string;
  evmNetworkId: number;
  evmPrivateEncrypted: string;
  userId: number;
  tokenAddress: string;
  amount: number;
  x25519privateKey: string;
}) {
  if (!walletAddress) {
    const errorMessage = "ERC20 Permit generation error: Wallet not found";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const provider = await getFastestProvider(evmNetworkId);
  const privateKey = await getPrivateKey(evmPrivateEncrypted, x25519privateKey);
  const adminWallet = await getAdminWallet(privateKey, provider);
  const tokenDecimals = await getTokenDecimals(tokenAddress, provider);

  const permitTransferFromData: PermitTransferFrom = {
    permitted: {
      token: tokenAddress,
      amount: utils.parseUnits(amount.toString(), tokenDecimals),
    },
    spender: walletAddress,
    nonce: BigInt(utils.keccak256(utils.toUtf8Bytes(`${userId}-${nonce}`))),
    deadline: MaxUint256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, evmNetworkId);
  return { adminWallet, permitTransferFromData, domain, types, values, logger };
}
