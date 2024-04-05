import { getPayoutConfigByNetworkId } from "../utils/payoutConfigByNetworkId";
import { ethers } from "ethers";
import { MaxUint256 } from "@uniswap/permit2-sdk";
import { keccak256, toUtf8Bytes } from "ethers";
import { Permit } from "../types/permits";
import { Context } from "../types/context";
import { isIssueEvent } from "../types/typeguards";

interface Erc721PermitSignatureData {
  beneficiary: string;
  deadline: bigint;
  keys: string[];
  nonce: bigint;
  values: string[];
}

const SIGNING_DOMAIN_NAME = "NftReward-Domain";
const SIGNING_DOMAIN_VERSION = "1";

const types = {
  MintRequest: [
    { name: "beneficiary", type: "address" },
    { name: "deadline", type: "uint256" },
    { name: "keys", type: "bytes32[]" },
    { name: "nonce", type: "uint256" },
    { name: "values", type: "string[]" },
  ],
};

export async function generateErc721PermitSignature(context: Context, username: string, contributionType: string): Promise<Permit> {
  const { NFT_MINTER_PRIVATE_KEY, NFT_CONTRACT_ADDRESS } = context.env;
  const { evmNetworkId } = context.config;
  const adapters = context.adapters;
  const logger = context.logger;

  const { rpc } = getPayoutConfigByNetworkId(evmNetworkId);

  if (!rpc) {
    logger.error("RPC is not defined");
    throw new Error("RPC is not defined");
  }

  if (!NFT_CONTRACT_ADDRESS) {
    const errorMesage = "NFT contract address is not defined";
    logger.error(errorMesage);
    throw new Error(errorMesage);
  }

  const beneficiary = await adapters.supabase.wallet.getWalletByUsername(username);
  if (!beneficiary) {
    logger.error("No wallet found for user");
    throw new Error("No wallet found for user");
  }

  const userId = await adapters.supabase.user.getUserIdByWallet(beneficiary);

  const organizationName = context.payload.repository.owner.login;
  const repositoryName = context.payload.repository.name;
  let issueId = "";
  if (isIssueEvent(context)) {
    issueId = context.payload.issue.id.toString();
  }

  let provider;
  let adminWallet;
  try {
    provider = new ethers.JsonRpcProvider(rpc);
  } catch (error) {
    logger.error("Failed to instantiate provider", error);
    throw new Error("Failed to instantiate provider");
  }

  try {
    adminWallet = new ethers.Wallet(NFT_MINTER_PRIVATE_KEY, provider);
  } catch (error) {
    logger.error("Failed to instantiate wallet", error);
    throw new Error("Failed to instantiate wallet");
  }

  const erc721Metadata = {
    GITHUB_ORGANIZATION_NAME: organizationName,
    GITHUB_REPOSITORY_NAME: repositoryName,
    GITHUB_ISSUE_ID: issueId,
    GITHUB_USERNAME: username,
    GITHUB_CONTRIBUTION_TYPE: contributionType,
  };

  const metadata = Object.entries(erc721Metadata);
  const erc721SignatureData: Erc721PermitSignatureData = {
    beneficiary: beneficiary,
    deadline: MaxUint256.toBigInt(),
    keys: metadata.map(([key]) => keccak256(toUtf8Bytes(key))),
    nonce: BigInt(keccak256(toUtf8Bytes(`${userId}-${issueId}`))),
    values: metadata.map(([, value]) => value),
  };

  const domain = {
    name: SIGNING_DOMAIN_NAME,
    version: SIGNING_DOMAIN_VERSION,
    verifyingContract: NFT_CONTRACT_ADDRESS,
    chainId: evmNetworkId,
  };

  const signature = await adminWallet.signTypedData(domain, types, erc721SignatureData).catch((error: unknown) => {
    logger.error("Failed to sign typed data", error);
    throw new Error("Failed to sign typed data");
  });

  const erc721Permit: Permit = {
    tokenType: "ERC721",
    tokenAddress: NFT_CONTRACT_ADDRESS,
    beneficiary: beneficiary,
    amount: "1",
    nonce: erc721SignatureData.nonce.toString(),
    deadline: erc721SignatureData.deadline.toString(),
    signature: signature,
    owner: adminWallet.address,
    networkId: evmNetworkId,
    erc721Request: {
      keys: erc721SignatureData.keys.map((key) => key.toString()),
      values: erc721SignatureData.values,
      metadata: erc721Metadata,
    },
  };

  console.info("Generated ERC721 permit signature", { erc721Permit });

  return erc721Permit;
}
