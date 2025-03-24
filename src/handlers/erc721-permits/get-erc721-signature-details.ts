import { MaxUint256 } from "@uniswap/permit2-sdk";
import { Wallet, utils } from "ethers";
import { logger } from "../../helpers/logger";
import { getFastestProvider } from "../../utils/get-fastest-provider";

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

export async function getErc721SignatureDetails({
  nftContractAddress,
  evmNetworkId,
  nftMinterPrivateKey,
  userId,
  userWalletAddress,
  nonce,
  organizationName,
  repositoryName,
  username,
  contributionType,
}: {
  nftContractAddress: string | undefined;
  evmNetworkId: number;
  nftMinterPrivateKey: string | undefined;
  userId: number;
  userWalletAddress: string;
  nonce: string;
  organizationName: string;
  repositoryName: string;
  username: string;
  contributionType: string;
}) {
  if (!nftContractAddress) {
    throw logger.error("ERC721 Permit generation: NFT Contract Address not found");
  }

  if (!nftMinterPrivateKey) {
    throw logger.error("ERC721 Permit generation: NFT Minter Private Key not found");
  }

  let adminWallet;
  const provider = await getFastestProvider(evmNetworkId);

  if (!provider) {
    throw logger.error("ERC721 Permit generation: Provider not found");
  }

  try {
    adminWallet = new Wallet(nftMinterPrivateKey, provider);
  } catch (err) {
    throw logger.error("ERC721 Permit generation: Failed to instantiate wallet", { err });
  }

  const erc721Metadata = {
    GITHUB_ORGANIZATION_NAME: organizationName,
    GITHUB_REPOSITORY_NAME: repositoryName,
    GITHUB_ISSUE_NODE_ID: nonce,
    GITHUB_USERNAME: username,
    GITHUB_CONTRIBUTION_TYPE: contributionType,
  };

  const metadata = Object.entries(erc721Metadata);
  const erc721SignatureData: Erc721PermitSignatureData = {
    beneficiary: userWalletAddress,
    deadline: MaxUint256.toBigInt(),
    keys: metadata.map(([key]) => utils.keccak256(utils.toUtf8Bytes(key))),
    nonce: BigInt(utils.keccak256(utils.toUtf8Bytes(`${userId}-${nonce}`))),
    values: metadata.map(([, value]) => value),
  };

  const domain = {
    name: SIGNING_DOMAIN_NAME,
    version: SIGNING_DOMAIN_VERSION,
    verifyingContract: nftContractAddress,
    chainId: evmNetworkId,
  };

  const signature = await adminWallet._signTypedData(domain, types, erc721SignatureData).catch((err) => {
    throw logger.error("ERC721 Permit generation: Failed to sign typed data", { err });
  });

  return { erc721SignatureData, erc721Metadata, signature, adminWallet };
}
