import { PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer } from "@uniswap/permit2-sdk";
import { ethers, keccak256, MaxInt256, parseUnits, toUtf8Bytes } from "ethers";
import { Context } from "../types/context";
import { Permit } from "../types/permits";
import { decryptKeys } from "../utils/keys";
import { getPayoutConfigByNetworkId } from "../utils/payoutConfigByNetworkId";

export async function generateErc20PermitSignature(context: Context, username: string, amount: number): Promise<Permit> {
  const config = context.config;
  const logger = context.logger;
  const { evmNetworkId, evmPrivateEncrypted } = config;
  const { user, wallet } = context.adapters.supabase;

  const userId = await user.getUserIdByUsername(username);
  const walletAddress = await wallet.getWalletByUserId(userId);
  let issueId: string;
  if ("issue" in context.payload) {
    issueId = context.payload.issue.id.toString();
  } else if ("pull_request" in context.payload) {
    issueId = context.payload.pull_request.id.toString();
  } else {
    throw new Error("Issue Id is missing");
  }

  if (!userId) {
    throw new Error("User was not found");
  }
  if (!walletAddress) {
    const errorMessage = "ERC20 Permit generation error: Wallet not found";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const { rpc, token, decimals } = getPayoutConfigByNetworkId(evmNetworkId);
  const { privateKey } = await decryptKeys(evmPrivateEncrypted);
  if (!privateKey) {
    const errorMessage = "Private key is not defined";
    logger.fatal(errorMessage);
    throw new Error(errorMessage);
  }

  let provider;
  let adminWallet;
  try {
    provider = new ethers.JsonRpcProvider(rpc);
  } catch (error) {
    throw logger.debug("Failed to instantiate provider", error);
  }

  try {
    adminWallet = new ethers.Wallet(privateKey, provider);
  } catch (error) {
    throw logger.debug("Failed to instantiate wallet", error);
  }

  const permitTransferFromData: PermitTransferFrom = {
    permitted: {
      token: token,
      amount: parseUnits(amount.toString(), decimals),
    },
    spender: walletAddress,
    nonce: BigInt(keccak256(toUtf8Bytes(`${userId}-${issueId}`))),
    deadline: MaxInt256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, evmNetworkId);

  const signature = await adminWallet
    .signTypedData(
      {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId ? domain.chainId.toString() : undefined,
        verifyingContract: domain.verifyingContract,
        salt: domain.salt?.toString(),
      },
      types,
      values
    )
    .catch((error) => {
      const errorMessage = `Failed to sign typed data ${error}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    });

  const erc20Permit: Permit = {
    tokenType: "ERC20",
    tokenAddress: permitTransferFromData.permitted.token,
    beneficiary: permitTransferFromData.spender,
    nonce: permitTransferFromData.nonce.toString(),
    deadline: permitTransferFromData.deadline.toString(),
    amount: permitTransferFromData.permitted.amount.toString(),
    owner: adminWallet.address,
    signature: signature,
    networkId: evmNetworkId,
  };

  logger.info("Generated ERC20 permit2 signature", erc20Permit);

  return erc20Permit;
}
