import { MaxUint256 } from "@uniswap/permit2-sdk";
import { keccak256, toUtf8Bytes } from "ethers";
import { generateErc721PermitSignature } from "../src";
import { Context } from "../src/types/context";
import { Env } from "../src/types/env";
import { cypherText, mockContext, NFT_CONTRACT_ADDRESS, SPENDER } from "./constants";
import { describe, expect, it, beforeEach, afterEach, jest } from "@jest/globals";

describe("generateErc721PermitSignature", () => {
  let context: Context;
  const userId = 123;

  // cSpell: disable

  jest.autoMockOn();

  beforeEach(() => {
    process.env.X25519_PRIVATE_KEY = "bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls";
    process.env.NFT_CONTRACT_ADDRESS = NFT_CONTRACT_ADDRESS;
    process.env.NFT_MINTER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    context = {
      ...mockContext,
      config: {
        evmNetworkId: 100,
        evmPrivateEncrypted: cypherText,
        isNftRewardEnabled: true,
        nftMinterPrivateKey: process.env.NFT_MINTER_PRIVATE_KEY,
        nftContractAddress: NFT_CONTRACT_ADDRESS,

        // possible inputs from workflow_dispatch
        token: NFT_CONTRACT_ADDRESS,
        amount: 100,
        spender: SPENDER,
        userId: 123,

        // nft specific inputs
        contribution_type: "contribution",
        issueID: 123,
      },
    } as unknown as Context;
    context.env = process.env as Env;
    context.eventName = "issues.closed";
    jest.mock("@supabase/supabase-js", () => {
      return {
        createClient: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockReturnValue({ id: 123 }),
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    });
    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(SPENDER);
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(userId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate ERC721 permit signature", async () => {
    const issueId = 123;
    const contributionType = "contribution";
    const userId = 123;

    const result = await generateErc721PermitSignature(userId, contributionType, context);

    const organizationName = "test";
    const repositoryName = "test";
    const issueNumber = issueId.toString();
    const keys = ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"];

    if (result && typeof result === "object") {
      expect(result).toBeDefined();
      expect(result.tokenType).toBe("ERC721");
      expect(result.tokenAddress).toBe(process.env.NFT_CONTRACT_ADDRESS);
      expect(result.amount).toBe("1");
      expect(result.erc721Request?.metadata).toBeDefined();
      expect(result.beneficiary).toBe(SPENDER);
      expect(result.deadline).toBe(MaxUint256.toString());
      expect(result.nonce).toBe(BigInt(keccak256(toUtf8Bytes(`${userId}-${issueId}`))).toString());
      expect(result.erc721Request?.values).toEqual([organizationName, repositoryName, issueNumber, userId, contributionType]);
      expect(result.networkId).toBe(context.config.evmNetworkId);
      const keysHashed = keys.map((key) => keccak256(toUtf8Bytes(key)));
      expect(result.erc721Request?.keys).toEqual(keysHashed);
    }

    expect(context.logger.error).not.toHaveBeenCalled();
  });

  it("should throw an error if RPC is not defined", async () => {
    context.config.evmNetworkId = 123;
    await expect(generateErc721PermitSignature(123, "contribution", context)).rejects.toThrow("No config setup for evmNetworkId: 123");
  });

  it("should throw an error if NFT minter private key is not defined", async () => {
    delete process.env.NFT_MINTER_PRIVATE_KEY;
    await expect(generateErc721PermitSignature(123, "contribution", context)).rejects.toThrow("Failed to instantiate wallet");
    expect(context.logger.error).toHaveBeenCalled();
  });

  it("should throw an error if NFT contract address is not defined", async () => {
    delete process.env.NFT_CONTRACT_ADDRESS;
    await expect(generateErc721PermitSignature(123, "contribution", context)).rejects.toThrow("NFT contract address is not defined");
    expect(context.logger.error).toHaveBeenCalled();
  });

  it("should throw an error if no wallet found for user", async () => {
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);
    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(null);

    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);

    await expect(generateErc721PermitSignature(123, "contribution", context)).rejects.toThrow("No wallet found for user");
    expect(context.logger.error).toHaveBeenCalledWith("No wallet found for user");
  });
});
