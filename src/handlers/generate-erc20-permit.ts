import { Context } from "../types/context";
import { PermitReward, TokenType } from "../types";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { getPayloadPermitDetails } from "./erc20-permits/get-payload-permit-details";
import { getPermitSignatureDetails } from "./erc20-permits/get-permit-signature-details";

export interface Payload {
  evmNetworkId: number;
  evmPrivateEncrypted: string;
  walletAddress: string;
  issueNodeId: string;
  logger: Logs;
  userId: number;
}

export async function generateErc20PermitSignature(payload: Payload, username: string, amount: number, tokenAddress: string): Promise<PermitReward>;
export async function generateErc20PermitSignature(context: Context, username: string, amount: number, tokenAddress: string): Promise<PermitReward>;
export async function generateErc20PermitSignature(
  contextOrPayload: Context | Payload,
  username: string,
  amount: number,
  tokenAddress: string
): Promise<PermitReward> {
  if (!username) {
    throw new Error("User was not found");
  }
  const {
    walletAddress,
    issueNodeId,
    evmNetworkId,
    evmPrivateEncrypted,
    userId,
    logger
  } = await getPayloadPermitDetails(contextOrPayload, username);

  const { adminWallet, permitTransferFromData, domain, types, values } = await getPermitSignatureDetails(
    walletAddress,
    issueNodeId,
    evmNetworkId,
    evmPrivateEncrypted,
    userId,
    tokenAddress,
    logger,
    amount
  );

  try {
    const signature = await adminWallet._signTypedData(domain, types, values);
    const erc20Permit: PermitReward = {
      tokenType: TokenType.ERC20,
      tokenAddress: permitTransferFromData.permitted.token,
      beneficiary: permitTransferFromData.spender,
      nonce: permitTransferFromData.nonce.toString(),
      deadline: permitTransferFromData.deadline.toString(),
      amount: permitTransferFromData.permitted.amount.toString(),
      owner: adminWallet.address,
      signature: signature,
      networkId: evmNetworkId,
    };

    logger.info("Generated ERC20 permit2 signature", { erc20Permit });
    return erc20Permit;
  } catch (error) {
    logger.error(`Failed to sign typed data: ${error}`);
    throw error;
  }
}