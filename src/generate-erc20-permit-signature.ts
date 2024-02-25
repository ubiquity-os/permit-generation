import { MaxUint256, PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer } from "@uniswap/permit2-sdk";
import { BigNumber, ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { getPayoutConfigByNetworkId } from "./utils/payoutConfigByNetworkId";
import { BotConfig, configGenerator } from "@ubiquibot/configuration";
import Decimal from "decimal.js";
import { decryptKeys } from "./utils/keys";

export async function generateErc20PermitSignature({ beneficiary, amount, issueId, userId }: GenerateErc20PermitSignatureParams) {
  const config = await configGenerator();

  // @ts-expect-error globalThis
  globalThis.window = undefined;
  // @ts-expect-error globalThis
  globalThis.importScripts = undefined;

  const {
    payments: { evmNetworkId },
    keys: { evmPrivateEncrypted },
  } = config;

  if (!evmPrivateEncrypted) throw console.warn("No bot wallet private key defined");
  const { rpc, paymentToken } = getPayoutConfigByNetworkId(evmNetworkId);
  const { privateKey } = await decryptKeys(evmPrivateEncrypted);

  if (!rpc) throw console.error("RPC is not defined");
  if (!privateKey) throw console.error("Private key is not defined");
  if (!paymentToken) throw console.error("Payment token is not defined");

  let provider;
  let adminWallet;
  try {
    provider = new ethers.providers.JsonRpcProvider(rpc);
  } catch (error) {
    throw console.debug("Failed to instantiate provider", error);
  }

  try {
    adminWallet = new ethers.Wallet(privateKey, provider);
  } catch (error) {
    throw console.debug("Failed to instantiate wallet", error);
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
    throw console.debug("Failed to sign typed data", error);
  });

  const transactionData: Erc20PermitTransactionData = {
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
  };

  console.info("Generated ERC20 permit2 signature", transactionData);

  return transactionData;
}
export interface GenerateErc20PermitSignatureParams {
  beneficiary: string;
  amount: Decimal;

  issueId: string;
  userId: string;
  config: BotConfig;
}

interface Erc20PermitTransactionData {
  type: "erc20-permit";
  permit: {
    permitted: {
      token: string;
      amount: string;
    };
    nonce: string;
    deadline: string;
  };
  transferDetails: {
    to: string;
    requestedAmount: string;
  };
  owner: string;
  signature: string;
  networkId: number;
}
