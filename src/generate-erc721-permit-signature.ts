import { getPayoutConfigByNetworkId } from "./utils/payoutConfigByNetworkId";
import { BigNumber, ethers, utils } from "ethers";
import { MaxUint256 } from "@uniswap/permit2-sdk";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

const NFT_MINTER_PRIVATE_KEY = process.env.NFT_MINTER_PRIVATE_KEY ?? "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const NFT_CONTRACT_ADDRESS = "0x38a70c040ca5f5439ad52d0e821063b0ec0b52b6"; // "0x6a87f05a74AB2EC25D1Eea0a3Cd24C3A2eCfF3E0";
const SIGNING_DOMAIN_NAME = "NftReward-Domain";
const SIGNING_DOMAIN_VERSION = "1";

export async function generateErc721PermitSignature({
  networkId,
  organizationName,
  repositoryName,
  issueNumber,
  issueId,
  beneficiary,
  username,
  userId,
  contributionType,
}: GenerateErc721PermitSignatureParams) {
  const { rpc } = getPayoutConfigByNetworkId(networkId);

  // @ts-expect-error globalThis
  globalThis.window = undefined;
  // @ts-expect-error globalThis
  globalThis.importScripts = undefined;

  let provider;
  let adminWallet;
  try {
    provider = new ethers.providers.JsonRpcProvider(rpc);
  } catch (error) {
    throw console.error("Failed to instantiate provider", error);
  }

  try {
    adminWallet = new ethers.Wallet(NFT_MINTER_PRIVATE_KEY, provider);
  } catch (error) {
    throw console.error("Failed to instantiate wallet", error);
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
        chainId: networkId,
      },
      types,
      erc721SignatureData
    )
    .catch((error: unknown) => {
      throw console.error("Failed to sign typed data", error);
    });

  const nftMetadata = {} as Record<string, string>;

  keys.forEach((element, index) => {
    nftMetadata[element] = erc721SignatureData.values[index];
  });

  const erc721Data: Erc721PermitTransactionData = {
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
    networkId: networkId,
    nftMetadata: nftMetadata as Erc721PermitTransactionData["nftMetadata"],
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

interface Erc721PermitSignatureData {
  beneficiary: string;
  deadline: BigNumber;
  keys: string[];
  nonce: BigNumber;
  values: string[];
}

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

interface Erc721PermitTransactionData {
  type: "erc721-permit";
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
  nftMetadata: {
    GITHUB_ORGANIZATION_NAME: string;
    GITHUB_REPOSITORY_NAME: string;
    GITHUB_ISSUE_ID: string;
    GITHUB_USERNAME: string;
    GITHUB_CONTRIBUTION_TYPE: string;
  };
  request: {
    beneficiary: string;
    deadline: string;
    keys: string[];
    nonce: string;
    values: string[];
  };
}

export type GenerateErc721PermitSignatureParams = {
  organizationName: string;
  repositoryName: string;
  issueId: string;
  issueNumber: string;
  beneficiary: string;
  username: string;
  userId: string;
  contributionType: string;
  networkId: number;
};
