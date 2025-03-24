import { logger } from "../helpers/logger";
import { TokenType } from "../types";
import { getPermitSignatureDetails } from "./erc20-permits/get-erc20-signature-details";

export async function generateErc20Permit({
  userWalletAddress,
  nonce,
  evmNetworkId,
  evmPrivateEncrypted,
  userId,
  tokenAddress,
  amount,
  x25519privateKey,
}: {
  userWalletAddress: string;
  nonce: string;
  evmNetworkId: number;
  evmPrivateEncrypted: string;
  userId: number;
  tokenAddress: string;
  amount: number;
  x25519privateKey: string;
}) {
  if (!evmPrivateEncrypted) {
    throw logger.error("Failed to decrypt evmPrivateEncrypted: input cannot be null or undefined");
  }
  try {
    const { adminWallet, permitTransferFromData, domain, types, values } = await getPermitSignatureDetails({
      userWalletAddress,
      nonce,
      evmNetworkId,
      evmPrivateEncrypted,
      userId,
      tokenAddress,
      amount,
      x25519privateKey,
    });

    return {
      tokenType: TokenType.ERC20,
      tokenAddress: permitTransferFromData.permitted.token,
      beneficiary: permitTransferFromData.spender,
      nonce: permitTransferFromData.nonce.toString(),
      deadline: permitTransferFromData.deadline.toString(),
      amount: permitTransferFromData.permitted.amount.toString(),
      owner: adminWallet.address,
      signature: await adminWallet._signTypedData(domain, types, values),
      networkId: evmNetworkId,
    } as const;
  } catch (error) {
    throw logger.error(`Failed to sign typed data`, { e: error });
  }
}
