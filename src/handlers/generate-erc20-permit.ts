import { PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer } from "@uniswap/permit2-sdk";
import { ethers, keccak256, MaxInt256, parseUnits, toUtf8Bytes } from "ethers";
import { Context, Logger } from "../types/context";
import { Permit } from "../types/permits";
import { decryptKeys } from "../utils/keys";
import { getPayoutConfigByNetworkId } from "../utils/payoutConfigByNetworkId";

export async function generateErc20PermitSignature(
  username: string,
  amount: number,
  evmNetworkId: number,
  evmPrivateEncrypted: string,
  userId: number,
  walletAddress: string,
  issueId: number,
  logger: Logger
): Promise<Permit>;
export async function generateErc20PermitSignature(username: string, amount: number, context: Context): Promise<Permit>;
export async function generateErc20PermitSignature(
  username: string,
  amount: number,
  contextOrNetworkId: Context | number,
  evmPrivateEncrypted?: string,
  userId?: number,
  walletAddress?: string,
  issueId?: number,
  logger?: Logger
): Promise<Permit> {
  let _logger: Logger;
  let _userId: number;
  let _walletAddress: string | null;
  let _issueId: number;
  let _evmNetworkId: number;
  let _evmPrivateEncrypted: string;

  if (typeof contextOrNetworkId === "number") {
    _logger = logger as Logger;
    _userId = userId as number;
    _walletAddress = walletAddress as string;
    _evmNetworkId = contextOrNetworkId;
    _evmPrivateEncrypted = evmPrivateEncrypted as string;
    _issueId = issueId as number;
  } else {
    const config = contextOrNetworkId.config;
    _logger = contextOrNetworkId.logger;
    const { evmNetworkId, evmPrivateEncrypted } = config;
    const { user, wallet } = contextOrNetworkId.adapters.supabase;
    _userId = await user.getUserIdByUsername(username);
    _walletAddress = await wallet.getWalletByUserId(_userId);
    _evmNetworkId = evmNetworkId;
    _evmPrivateEncrypted = evmPrivateEncrypted;
    if ("issue" in contextOrNetworkId.payload) {
      _issueId = contextOrNetworkId.payload.issue.id;
    } else if ("pull_request" in contextOrNetworkId.payload) {
      _issueId = contextOrNetworkId.payload.pull_request.id;
    } else {
      throw new Error("Issue Id is missing");
    }
  }

  if (!_userId) {
    throw new Error("User was not found");
  }
  if (!_walletAddress) {
    const errorMessage = "ERC20 Permit generation error: Wallet not found";
    _logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const { rpc, token, decimals } = getPayoutConfigByNetworkId(_evmNetworkId);
  const { privateKey } = await decryptKeys(_evmPrivateEncrypted);
  if (!privateKey) {
    const errorMessage = "Private key is not defined";
    _logger.fatal(errorMessage);
    throw new Error(errorMessage);
  }

  let provider;
  let adminWallet;
  try {
    provider = new ethers.JsonRpcProvider(rpc);
  } catch (error) {
    throw _logger.debug("Failed to instantiate provider", error);
  }

  try {
    adminWallet = new ethers.Wallet(privateKey, provider);
  } catch (error) {
    throw _logger.debug("Failed to instantiate wallet", error);
  }

  const permitTransferFromData: PermitTransferFrom = {
    permitted: {
      token: token,
      amount: parseUnits(amount.toString(), decimals),
    },
    spender: _walletAddress,
    nonce: BigInt(keccak256(toUtf8Bytes(`${_userId}-${_issueId}`))),
    deadline: MaxInt256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, _evmNetworkId);

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
      _logger.error(errorMessage);
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
    networkId: _evmNetworkId,
  };

  _logger.info("Generated ERC20 permit2 signature", erc20Permit);

  return erc20Permit;
}
