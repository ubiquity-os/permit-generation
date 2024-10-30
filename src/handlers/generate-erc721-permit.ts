import { Context, PermitRequest, TokenType } from "../types";
import { getErc721SignatureDetails } from "./erc721-permits/get-erc721-signature-details";

export async function generateErc721Permit({
  walletAddress,
  issueNodeId,
  evmNetworkId,
  userId,
  tokenAddress,
  permitRequest,
  env,
}: {
  walletAddress: string;
  issueNodeId: string;
  evmNetworkId: number;
  userId: number;
  tokenAddress: string;
  permitRequest: PermitRequest;
  env: Context["env"];
}) {
  if (permitRequest.type !== "ERC721") {
    throw new Error(`Tried to generate ERC721 permit with invalid type: ${permitRequest.type}`);
  }

  const {
    erc721Request: { metadata },
  } = permitRequest;

  const {
    adminWallet: erc721AdminWallet,
    erc721SignatureData,
    erc721Metadata,
    signature,
  } = await getErc721SignatureDetails({
    walletAddress,
    issueNodeId,
    evmNetworkId,
    nftContractAddress: tokenAddress,
    nftMinterPrivateKey: env.NFT_MINTER_PRIVATE_KEY,
    contributionType: metadata.GITHUB_CONTRIBUTION_TYPE,
    organizationName: metadata.GITHUB_ORGANIZATION_NAME,
    repositoryName: metadata.GITHUB_REPOSITORY_NAME,
    username: metadata.GITHUB_USERNAME,
    userId,
  });

  return {
    tokenType: TokenType.ERC721,
    tokenAddress,
    beneficiary: walletAddress,
    amount: "1",
    nonce: erc721SignatureData.nonce.toString(),
    deadline: erc721SignatureData.deadline.toString(),
    signature: signature,
    owner: erc721AdminWallet.address,
    networkId: evmNetworkId,
    erc721Request: {
      keys: erc721SignatureData.keys.map((key) => key.toString()),
      values: erc721SignatureData.values,
      metadata: erc721Metadata,
    },
  } as const;
}
