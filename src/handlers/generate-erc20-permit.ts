import { logger } from "../helpers/logger";
import { TokenType } from "../types";
import { getPermitSignatureDetails } from "./erc20-permits/get-erc20-signature-details";

export async function generateErc20Permit({
  walletAddress,
  issueNodeId,
  evmNetworkId,
  evmPrivateEncrypted,
  userId,
  tokenAddress,
  amount,
  x25519privateKey,
}: {
  walletAddress: string;
  issueNodeId: string;
  evmNetworkId: number;
  evmPrivateEncrypted: string;
  userId: number;
  tokenAddress: string;
  amount: number;
  x25519privateKey: string;
}) {
  if (!evmPrivateEncrypted) {
    throw new Error(logger.error("Failed to decrypt a private key: TypeError: input cannot be null or undefined").logMessage.raw);
  }
  try {
    const { adminWallet, permitTransferFromData, domain, types, values } = await getPermitSignatureDetails({
      walletAddress,
      issueNodeId,
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
    logger.error(`Failed to sign typed data: ${String(error)}`);
    throw error;
  }
}
