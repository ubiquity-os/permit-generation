import { MaxUint256 } from "@uniswap/permit2-sdk";
import { Wallet, utils, TypedDataDomain, TypedDataField } from "ethers";
import { Context } from "../src/types/context";
import { cypherText, mockContext, NFT_CONTRACT_ADDRESS, SPENDER } from "./constants";
import { describe, expect, it, beforeEach, afterEach, jest } from "@jest/globals";
import { generateErc721Permit } from "../src/handlers/generate-erc721-permit";
import { generatePayoutPermits } from "../src";
import "@supabase/supabase-js";
import { logger } from "../src/helpers/logger";

jest.autoMockOn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }),
}));

describe("generateErc721PermitSignature", () => {
  let context: Context;
  const userId = 123;

  beforeEach(() => {
    context = {
      ...mockContext,
      config: {
        ...mockContext.config,
        permitRequests: [
          {
            amount: 1,
            evmNetworkId: 100,
            issueNodeId: "123",
            tokenAddress: NFT_CONTRACT_ADDRESS,
            type: "ERC721",
            userId: 123,
            erc721Request: {
              contributionType: "contribution",
              keys: ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_NODE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"],
              metadata: {
                GITHUB_CONTRIBUTION_TYPE: "contribution",
                GITHUB_ISSUE_NODE_ID: "123",
                GITHUB_ORGANIZATION_NAME: "test",
                GITHUB_REPOSITORY_NAME: "test",
                GITHUB_USERNAME: "123",
              },
              values: ["test", "test", "123", "123", "contribution"],
            },
          },
        ],
      },
      octokit: {
        request() {
          return { data: { id: 1, login: "123" } };
        },
        rest: {
          users: {
            getByUsername: jest.fn().mockReturnValue({ data: { id: userId } }),
          },
        },
      },
    } as unknown as Context;
    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(SPENDER);
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(userId);
    jest
      .spyOn(Wallet.prototype, "_signTypedData")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, unknown>) => {
        return Promise.resolve("0x0");
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate ERC721 permit signature", async () => {
    const issueId = 123;
    const contributionType = "contribution";
    const userId = "123";

    const loggerSpy = jest.spyOn(logger, "error");

    const result = await generateErc721Permit({
      env: context.env,
      permitRequest: context.config.permitRequests[0],
      walletAddress: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
    });

    const organizationName = "test";
    const repositoryName = "test";
    const issueNumber = issueId.toString();
    const keys = ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_NODE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"];

    if (result && typeof result === "object") {
      expect(result).toBeDefined();
      expect(result.tokenType).toBe("ERC721");
      expect(result.tokenAddress).toBe(NFT_CONTRACT_ADDRESS);
      expect(result.amount).toBe(1);
      expect(result.erc721Request?.metadata).toBeDefined();
      expect(result.beneficiary).toBe("0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd");
      expect(result.deadline).toBe(MaxUint256.toString());
      expect(result.nonce).toBe(BigInt(utils.keccak256(utils.toUtf8Bytes(`${userId}-${issueId}`))).toString());
      expect(result.erc721Request?.values).toEqual([organizationName, repositoryName, issueNumber, userId, contributionType]);
      expect(result.networkId).toBe(context.config.permitRequests[0].evmNetworkId);
      const keysHashed = keys.map((key) => utils.keccak256(utils.toUtf8Bytes(key)));
      expect(result.erc721Request?.keys).toEqual(keysHashed);
    }

    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it("should throw an error if RPC is not defined", async () => {
    context.config.permitRequests[0].evmNetworkId = 0;
    await expect(
      generateErc721Permit({
        env: context.env,
        permitRequest: context.config.permitRequests[0],
        walletAddress: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      })
    ).rejects.toThrow("Failed to get fastest provider for networkId: 0");
  });

  it("should throw an error if NFT minter private key is not defined", async () => {
    const loggerSpy = jest.spyOn(logger, "error");
    context.env.NFT_MINTER_PRIVATE_KEY = null as unknown as string;
    await expect(
      generateErc721Permit({
        env: context.env,
        permitRequest: context.config.permitRequests[0],
        walletAddress: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      })
    ).rejects.toThrow("NFT Minter Private Key not found");
    expect(loggerSpy).toHaveBeenCalledWith("NFT Minter Private Key not found");
  });

  it("should throw an error if NFT contract address is not defined", async () => {
    const loggerSpy = jest.spyOn(logger, "error");

    context.env.NFT_CONTRACT_ADDRESS = null as unknown as string;
    await expect(
      generateErc721Permit({
        env: context.env,
        permitRequest: context.config.permitRequests[0],
        walletAddress: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      })
    ).rejects.toThrow("NFT Address not found");
    expect(loggerSpy).toHaveBeenCalledWith("NFT Address not found");
  });

  it("should throw an error if no wallet found for user", async () => {
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);
    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(null);

    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);

    await expect(
      generatePayoutPermits({
        config: {
          evmPrivateEncrypted: cypherText,
          permitRequests: [
            {
              kind: "ERC721",
              evmNetworkId: 100,
              issueNodeId: "123",
              tokenAddress: NFT_CONTRACT_ADDRESS,
              userId: 123,
              amount: 1,
              erc721Request: {
                contributionType: "contribution",
                keys: ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_NODE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"],
                values: ["test", "test", "123", "123", "contribution"],
                metadata: {
                  GITHUB_CONTRIBUTION_TYPE: "contribution",
                  GITHUB_ISSUE_NODE_ID: "123",
                  GITHUB_ORGANIZATION_NAME: "test",
                  GITHUB_REPOSITORY_NAME: "test",
                  GITHUB_USERNAME: "123",
                },
              },
              type: "ERC721",
            },
          ],
        },
        env: context.env,
        adapters: context.adapters,
      })
    ).rejects.toThrow("Wallet not found for user with id 123");
    expect(context.logger.error).toHaveBeenCalledWith("Failed to generate permit: ", {
      caller: "_Logs.<anonymous>",
      er: "Error: Wallet not found for user with id 123",
    });
  });
});
