// src/handlers/generate-erc20-permit.ts

import { PluginInput, PluginOutput, Reward } from "../types/plugin-interfaces";
import { PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer, MaxUint256 } from "@uniswap/permit2-sdk";
import { ethers, utils } from "ethers";
import { decrypt, parseDecryptedPrivateKey } from "../utils";
import { getFastestProvider } from "../utils/get-fastest-provider";

export async function generateErc20Permit(input: PluginInput): Promise<PluginOutput> {
  const { eventContext, inputValue, metadata } = input;
  const { payload, config, env } = eventContext;

  // Deserialize inputValue if needed
  const { username, amount, tokenAddress } = JSON.parse(inputValue);

  let logger = metadata?.logger;
  let walletAddress: string | null | undefined;
  let issueNodeId: string;
  let evmNetworkId: number;
  let evmPrivateEncrypted: string;
  let userId: number;

  if ("issueNodeId" in metadata) {
    logger = metadata.logger as Logger;
    walletAddress = metadata.walletAddress;
    evmNetworkId = metadata.evmNetworkId;
    evmPrivateEncrypted = metadata.evmPrivateEncrypted;
    issueNodeId = metadata.issueNodeId;
    userId = metadata.userId;
  } else {
    const config = eventContext.config;
    logger = metadata.logger;
    const { evmNetworkId: configEvmNetworkId, evmPrivateEncrypted: configEvmPrivateEncrypted } = config;
    const { data: userData } = await metadata.octokit.rest.users.getByUsername({ username });
    if (!userData) {
      throw new Error(`GitHub user was not found for id ${username}`);
    }
    userId = userData.id;
    const { wallet } = metadata.adapters.supabase;
    walletAddress = await wallet.getWalletByUserId(userId);
    evmNetworkId = configEvmNetworkId;
    evmPrivateEncrypted = configEvmPrivateEncrypted;
    if ("issue" in payload) {
      issueNodeId = payload.issue.node_id;
    } else if ("pull_request" in payload) {
      issueNodeId = payload.pull_request.node_id;
    } else {
      throw new Error("Issue Id is missing");
    }
  }

  if (!username) {
    throw new Error("User was not found");
  }
  if (!walletAddress) {
    const errorMessage = "ERC20 Permit generation error: Wallet not found";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const provider = await getFastestProvider(evmNetworkId);
  if (!provider) {
    logger.error("Provider is not defined");
    throw new Error("Provider is not defined");
  }

  const privateKey = await getPrivateKey(evmPrivateEncrypted, logger);
  const adminWallet = await getAdminWallet(privateKey, provider, logger);
  const tokenDecimals = await getTokenDecimals(tokenAddress, provider, logger);

  const permitTransferFromData: PermitTransferFrom = {
    permitted: {
      token: tokenAddress,
      amount: utils.parseUnits(amount.toString(), tokenDecimals),
    },
    spender: walletAddress,
    nonce: BigInt(utils.keccak256(utils.toUtf8Bytes(`${userId}-${issueNodeId}`))),
    deadline: MaxUint256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, evmNetworkId);

  try {
    const signature = await adminWallet._signTypedData(domain, types, values);

    const erc20Permit: Reward = {
      type: "ERC20",
      amount: Number(permitTransferFromData.permitted.amount.toString()),
      tokenAddress: permitTransferFromData.permitted.token,
      beneficiary: permitTransferFromData.spender,
    };

    const commentOutput = `<p>Generated ERC20 permit for ${username} with amount ${amount} tokens.</p>`;

    logger.info("Generated ERC20 permit2 signature", erc20Permit);

    return {
      rewards: [erc20Permit],
      commentOutput,
      metadata: {
        additionalInfo: "Example metadata",
      },
    };
  } catch (error) {
    logger.error(`Failed to sign typed data: ${error}`);
    throw error;
  }
}

async function getPrivateKey(evmPrivateEncrypted: string, logger: Logger) {
  try {
    const privateKeyDecrypted = await decrypt(evmPrivateEncrypted, String(process.env.X25519_PRIVATE_KEY));
    const privateKeyParsed = parseDecryptedPrivateKey(privateKeyDecrypted);
    const privateKey = privateKeyParsed.privateKey;
    if (!privateKey) throw new Error("Private key is not defined");
    return privateKey;
  } catch (error) {
    const errorMessage = `Failed to decrypt a private key: ${error}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

async function getAdminWallet(privateKey: string, provider: ethers.providers.Provider, logger: Logger) {
  try {
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    const errorMessage = `Failed to instantiate wallet: ${error}`;
    logger.debug(errorMessage);
    throw new Error(errorMessage);
  }
}

async function getTokenDecimals(tokenAddress: string, provider: ethers.providers.Provider, logger: Logger) {
  try {
    const erc20Abi = ["function decimals() public view returns (uint8)"];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    return await tokenContract.decimals();
  } catch (error) {
    const errorMessage = `Failed to get token decimals for token: ${tokenAddress}, ${error}`;
    logger.debug(errorMessage, { error });
    throw new Error(errorMessage);
  }
}
