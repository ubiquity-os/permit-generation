import { getPayoutConfigByNetworkId } from "../utils/payoutConfigByNetworkId";
import { BigNumber, ethers, utils } from "ethers";
import { MaxUint256 } from "@uniswap/permit2-sdk";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { Erc721PermitSignatureData, PermitTransactionData } from "../types/permits";
import { Context } from "../types/context";

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

const keys = ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"];

export async function generateErc721PermitSignature(
  context: Context,
  issueId: number,
  contributionType: string,
  username: string
): Promise<PermitTransactionData | string> {
  const NFT_MINTER_PRIVATE_KEY = process.env.NFT_MINTER_PRIVATE_KEY;
  const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;

  const { evmNetworkId } = context.config;
  const adapters = context.adapters;
  const logger = context.logger;

  const { rpc } = getPayoutConfigByNetworkId(evmNetworkId);

  if (!rpc) {
    logger.error("RPC is not defined");
    throw new Error("RPC is not defined");
  }
  if (!NFT_MINTER_PRIVATE_KEY) {
    logger.error("NFT minter private key is not defined");
    throw new Error("NFT minter private key is not defined");
  }
  if (!NFT_CONTRACT_ADDRESS) {
    logger.error("NFT contract address is not defined");
    throw new Error("NFT contract address is not defined");
  }

  const beneficiary = await adapters.supabase.wallet.getWalletByUsername(username);
  if (!beneficiary) {
    logger.error("No wallet found for user");
    throw new Error("No wallet found for user");
  }

  const userId = await adapters.supabase.user.getUserIdByWallet(beneficiary);

  const organizationName = context.payload.repository.owner.login;
  const repositoryName = context.payload.repository.name;
  const issueNumber = issueId.toString();

  let provider;
  let adminWallet;
  try {
    provider = new ethers.providers.JsonRpcProvider(rpc);
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

  const erc721SignatureData: Erc721PermitSignatureData = {
    beneficiary: beneficiary,
    deadline: MaxUint256,
    keys: keys.map((key) => utils.keccak256(utils.toUtf8Bytes(key))),
    nonce: BigNumber.from(keccak256(toUtf8Bytes(`${userId}-${issueId}`))),
    values: [organizationName, repositoryName, issueNumber, username, contributionType],
  };

  const signature = await adminWallet
    ._signTypedData(
      {
        name: SIGNING_DOMAIN_NAME,
        version: SIGNING_DOMAIN_VERSION,
        verifyingContract: NFT_CONTRACT_ADDRESS,
        chainId: evmNetworkId,
      },
      types,
      erc721SignatureData
    )
    .catch((error: unknown) => {
      logger.error("Failed to sign typed data", error);
      throw new Error("Failed to sign typed data");
    });

  const nftMetadata = {} as Record<string, string>;

  keys.forEach((element, index) => {
    nftMetadata[element] = erc721SignatureData.values[index];
  });

  const erc721Data: PermitTransactionData = {
    type: "erc721-permit",
    permit: {
      permitted: {
        token: NFT_CONTRACT_ADDRESS,
        amount: "1",
      },
      nonce: erc721SignatureData.nonce.toString(),
      deadline: erc721SignatureData.deadline.toString(),
    },
    transferDetails: {
      to: beneficiary,
      requestedAmount: "1",
    },
    owner: adminWallet.address,
    signature: signature,
    networkId: evmNetworkId,
    nftMetadata: nftMetadata as PermitTransactionData["nftMetadata"],
    request: {
      beneficiary: erc721SignatureData.beneficiary,
      deadline: erc721SignatureData.deadline.toString(),
      keys: erc721SignatureData.keys.map((key) => key.toString()),
      nonce: erc721SignatureData.nonce.toString(),
      values: erc721SignatureData.values,
    },
  };

  console.info("Generated ERC721 permit signature", { erc721Data });

  return erc721Data;
}
