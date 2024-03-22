import { BigNumber, utils } from "ethers";
import { generateErc721PermitSignature } from "../src/handlers/generate-erc721-permit";
import { Context } from "../src/types/context";
import { mockContext } from "./constants";

describe("generateErc721PermitSignature", () => {
  let context: Context;

  const SPENDER = "0x0000000000000000000000000000000000000001";

  // cSpell: disable
  const cypherText =
    "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

  jest.autoMockOn();

  jest.mock("@supabase/supabase-js", () => {
    return {
      createClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ id: 123 }),
                }),
              }),
            }),
          }),
        }),
      }),
    };
  });

  beforeEach(() => {
    process.env.X25519_PRIVATE_KEY = "bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls";
    process.env.NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
    process.env.NFT_MINTER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    context = {
      ...mockContext,
      config: {
        evmNetworkId: 1,
        evmPrivateEncrypted: cypherText,
        isNftRewardEnabled: true,
        nftMinterPrivateKey: process.env.NFT_MINTER_PRIVATE_KEY,
        nftContractAddress: process.env.NFT_CONTRACT_ADDRESS,

        // possible inputs from workflow_dispatch
        token: process.env.NFT_CONTRACT_ADDRESS,
        amount: 100,
        spender: SPENDER,
        userId: 123,

        // nft specific inputs
        contribution_type: "contribution",
        username: "tester",
        issueID: 123,
      },
    } as unknown as Context;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate ERC721 permit signature", async () => {
    const issueId = 123;
    const contributionType = "contribution";
    const username = "tester";

    (context.adapters.supabase.wallet.getWalletByUsername as jest.Mock).mockReturnValue(SPENDER);
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(123);

    const result = await generateErc721PermitSignature(context, issueId, contributionType, username);

    const organizationName = "test";
    const repositoryName = "test";
    const issueNumber = issueId.toString();
    const userId = context.config.userId;
    const keys = ["GITHUB_ORGANIZATION_NAME", "GITHUB_REPOSITORY_NAME", "GITHUB_ISSUE_ID", "GITHUB_USERNAME", "GITHUB_CONTRIBUTION_TYPE"];

    if (result && typeof result === "object") {
      expect(result).toBeDefined();
      expect(result.type).toBe("erc721-permit");
      expect(result.permit.permitted.token).toBe(process.env.NFT_CONTRACT_ADDRESS);
      expect(result.permit.permitted.amount).toBe("1");
      expect(result.nftMetadata).toBeDefined();
      expect(result.request.beneficiary).toBe(context.config.spender);
      expect(result.request.deadline).toBe(BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff").toString());
      expect(result.request.nonce).toBe(BigNumber.from(utils.keccak256(utils.toUtf8Bytes(`${userId}-${issueId}`))).toString());
      expect(result.request.values).toEqual([organizationName, repositoryName, issueNumber, username, contributionType]);
      expect(result.networkId).toBe(context.config.evmNetworkId);
      const keysHashed = keys.map((key) => utils.keccak256(utils.toUtf8Bytes(key)));
      expect(result.request.keys).toEqual(keysHashed);
    }

    expect(context.logger.error).not.toHaveBeenCalled();
  });

  it("should throw an error if RPC is not defined", async () => {
    context.config.evmNetworkId = 123;
    await expect(generateErc721PermitSignature(context, 123, "contribution", "tester")).rejects.toThrow("No config setup for evmNetworkId: 123");
  });

  it("should throw an error if NFT minter private key is not defined", async () => {
    delete process.env.NFT_MINTER_PRIVATE_KEY;
    await expect(generateErc721PermitSignature(context, 123, "contribution", "tester")).rejects.toThrow("NFT minter private key is not defined");
    expect(context.logger.error).toHaveBeenCalledWith("NFT minter private key is not defined");
  });

  it("should throw an error if NFT contract address is not defined", async () => {
    delete process.env.NFT_CONTRACT_ADDRESS;
    await expect(generateErc721PermitSignature(context, 123, "contribution", "tester")).rejects.toThrow("NFT contract address is not defined");
    expect(context.logger.error).toHaveBeenCalledWith("NFT contract address is not defined");
  });

  it("should throw an error if no wallet found for user", async () => {
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);
    (context.adapters.supabase.wallet.getWalletByUsername as jest.Mock).mockReturnValue(null);

    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(null);

    await expect(generateErc721PermitSignature(context, 123, "contribution", "tester")).rejects.toThrow("No wallet found for user");
    expect(context.logger.error).toHaveBeenCalledWith("No wallet found for user");
  });
});
