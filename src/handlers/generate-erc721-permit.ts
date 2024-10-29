import { Context } from "../types/context";
import { PermitReward, TokenType } from "../types";
import { getFastestProvider } from "../utils/get-fastest-provider";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { getErc721PermitDetails } from "./erc721-permits/get-erc721-permit-details";
import { getErc721SignatureDetails } from "./erc721-permits/get-erc721-signature-details";

export interface PermitPayload {
  evmNetworkId: number;
  nftMinterPrivateKey: string;
  nftContractAddress: string;
  walletAddress: string;
  logger: Logs;
  issueNodeId: string;
  organizationName: string;
  repositoryName: string;
  userId: number;
}

export async function generateErc721PermitSignature(permitPayload: PermitPayload, username: string, contributionType: string): Promise<PermitReward>;
export async function generateErc721PermitSignature(context: Context, username: string, contributionType: string): Promise<PermitReward>;
export async function generateErc721PermitSignature(
  contextOrPermitPayload: Context | PermitPayload,
  username: string,
  contributionType: string
): Promise<PermitReward> {
  const {
    _logger,
    _nftContractAddress,
    _evmNetworkId,
    _nftMinterPrivateKey,
    _userId,
    _walletAddress,
    _issueNodeId,
    _organizationName,
    _repositoryName,
  } = await getErc721PermitDetails(contextOrPermitPayload, username);

  const provider = await getFastestProvider(_evmNetworkId);

  if (!provider) {
    _logger.error("Provider is not defined");
    throw new Error("Provider is not defined");
  }

  if (!_nftContractAddress) {
    const errorMessage = "NFT contract address is not defined";
    _logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const { erc721SignatureData, erc721Metadata, signature, adminWallet } = await getErc721SignatureDetails(
    _logger,
    _nftContractAddress,
    _evmNetworkId,
    _nftMinterPrivateKey,
    _userId,
    _walletAddress,
    _issueNodeId,
    _organizationName,
    _repositoryName,
    username,
    contributionType,
    provider
  );

  return {
    tokenType: TokenType.ERC721,
    tokenAddress: _nftContractAddress,
    beneficiary: _walletAddress,
    amount: "1",
    nonce: erc721SignatureData.nonce.toString(),
    deadline: erc721SignatureData.deadline.toString(),
    signature: signature,
    owner: adminWallet.address,
    networkId: _evmNetworkId,
    erc721Request: {
      keys: erc721SignatureData.keys.map((key) => key.toString()),
      values: erc721SignatureData.values,
      metadata: erc721Metadata,
    },
  } as PermitReward;
}