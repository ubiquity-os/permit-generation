import { MaxUint256, PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer } from "@uniswap/permit2-sdk";
import { BigNumber, ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { getPayoutConfigByNetworkId } from "../utils/payoutConfigByNetworkId";
import { decryptKeys } from "../utils/keys";
import { PermitTransactionData } from "../types/permits";
import Decimal from "decimal.js";
import { Context } from "../types/context";

export async function generateErc20PermitSignature(context: Context): Promise<PermitTransactionData | void> {
  const config = context.config;
  const logger = context.logger;
  const payload = context.payload;

  if (!("issue" in payload) || !payload.issue) {
    context.logger.debug("Not an issue event");
    return;
  }

  const beneficiary = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const amount = new Decimal(100);
  const issueId = "123";
  const userId = "123";

  const {
    payments: { evmNetworkId },
    keys: { evmPrivateEncrypted },
  } = config;

  if (!evmPrivateEncrypted) throw logger.warn("No bot wallet private key defined");
  const { rpc, paymentToken } = getPayoutConfigByNetworkId(evmNetworkId);
  const { privateKey } = await decryptKeys(evmPrivateEncrypted);

  if (!rpc) throw logger.error("RPC is not defined");
  if (!privateKey) throw logger.error("Private key is not defined");
  if (!paymentToken) throw logger.error("Payment token is not defined");

  let provider;
  let adminWallet;
  try {
    provider = new ethers.providers.JsonRpcProvider(rpc);
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
      token: paymentToken,
      amount: ethers.utils.parseUnits(amount.toString(), 18),
    },
    spender: beneficiary,
    nonce: BigNumber.from(keccak256(toUtf8Bytes(`${userId}-${issueId}`))),
    deadline: MaxUint256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, evmNetworkId);

  const signature = await adminWallet._signTypedData(domain, types, values).catch((error) => {
    throw logger.debug("Failed to sign typed data", error);
  });

  const transactionData = {
    type: "erc20-permit",
    permit: {
      permitted: {
        token: permitTransferFromData.permitted.token,
        amount: permitTransferFromData.permitted.amount.toString(),
      },
      nonce: permitTransferFromData.nonce.toString(),
      deadline: permitTransferFromData.deadline.toString(),
    },
    transferDetails: {
      to: permitTransferFromData.spender,
      requestedAmount: permitTransferFromData.permitted.amount.toString(),
    },
    owner: adminWallet.address,
    signature: signature,
    networkId: evmNetworkId,
  } as PermitTransactionData;

  logger.info("Generated ERC20 permit2 signature", transactionData);

  return transactionData;
}
