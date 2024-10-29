import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { Context } from "../../types";
import { PermitPayload } from "../generate-erc721-permit";
import { isIssueEvent } from "../../types/typeguards";

export async function getErc721PermitDetails(
    contextOrPermitPayload: Context | PermitPayload,
    username: string
) {
    let _logger: Logs;
    let _nftContractAddress: string;
    let _evmNetworkId: number;
    let _nftMinterPrivateKey: string;
    let _userId: number;
    let _walletAddress: string;
    let _issueNodeId: string;
    let _organizationName: string;
    let _repositoryName: string;
    let _username = username;

    if ("evmNetworkId" in contextOrPermitPayload) {
        _logger = contextOrPermitPayload.logger;
        _nftContractAddress = contextOrPermitPayload.nftContractAddress;
        _nftMinterPrivateKey = contextOrPermitPayload.nftMinterPrivateKey;
        _evmNetworkId = contextOrPermitPayload.evmNetworkId;
        _walletAddress = contextOrPermitPayload.walletAddress;
        _issueNodeId = contextOrPermitPayload.issueNodeId;
        _organizationName = contextOrPermitPayload.organizationName;
        _repositoryName = contextOrPermitPayload.repositoryName;
        _userId = contextOrPermitPayload.userId;
    } else {
        const { NFT_MINTER_PRIVATE_KEY, NFT_CONTRACT_ADDRESS } = contextOrPermitPayload.env;
        const { evmNetworkId } = contextOrPermitPayload.config;
        const adapters = contextOrPermitPayload.adapters;
        _logger = contextOrPermitPayload.logger;
        _nftContractAddress = NFT_CONTRACT_ADDRESS;
        _evmNetworkId = evmNetworkId;
        _nftMinterPrivateKey = NFT_MINTER_PRIVATE_KEY;
        _username = username;
        if (isIssueEvent(contextOrPermitPayload)) {
            _issueNodeId = contextOrPermitPayload.payload.issue.node_id;
        } else {
            throw new Error("Issue Id is missing.");
        }
        _organizationName = contextOrPermitPayload.payload.repository.owner.login;
        _repositoryName = contextOrPermitPayload.payload.repository.name;
        const { data: userData } = await contextOrPermitPayload.octokit.users.getByUsername({ username: _username });
        if (!userData) {
            throw new Error(`GitHub user was not found for id ${_username}`);
        }
        _userId = userData.id;
        const walletAddress = await adapters.supabase.wallet.getWalletByUserId(_userId);
        if (!walletAddress) {
            _logger.error("No wallet found for user");
            throw new Error("No wallet found for user");
        }
        _walletAddress = walletAddress;
    }

    return {
        _logger,
        _nftContractAddress,
        _evmNetworkId,
        _nftMinterPrivateKey,
        _userId,
        _walletAddress,
        _issueNodeId,
        _organizationName,
        _repositoryName,
        _username
    }
}