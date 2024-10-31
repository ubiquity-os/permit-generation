import { Context } from "../src/types/context";
import { mockContext, NFT_CONTRACT_ADDRESS, SPENDER } from "./constants";
import { describe, expect, it, beforeEach, afterEach, jest } from "@jest/globals";
import { Wallet, TypedDataDomain, TypedDataField } from "ethers";
import { generatePayoutPermits } from "../src";
import "@supabase/supabase-js";

jest.autoMockOn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }),
}));
describe("generatePayoutPermit", () => {
  let context: Context;
  const userId = 123;

  beforeEach(() => {
    context = {
      ...mockContext,
      config: {
        ...mockContext.config,
        permitRequests: [
          ...mockContext.config.permitRequests,
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
        users: {
          getByUsername: jest.fn().mockReturnValue({ data: { id: userId } }),
        },
      },
    } as unknown as Context;
    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(SPENDER);
    (context.adapters.supabase.user.getUserIdByWallet as jest.Mock).mockReturnValue(userId);
    (context.adapters.supabase.user.getUserById as jest.Mock).mockReturnValue({ wallet_id: 1 });
    jest
      .spyOn(Wallet.prototype, "_signTypedData")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, unknown>) => {
        return Promise.resolve("0xmocksignature");
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate payout permit signatures for ERC721 and ERC20", async () => {
    const result = await generatePayoutPermits(context);
    expect(result).toEqual([
      {
        amount: "100000000000000000000",
        beneficiary: "123",
        deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        networkId: 100,
        nonce: "28290789875493039658039458533958603742651083423638415458747066904844975862062",
        owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        signature: "0xmocksignature",
        tokenAddress: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
        tokenType: "ERC20",
      },
      {
        amount: 1,
        beneficiary: "123",
        deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        erc721Request: {
          keys: [
            "0x3e4c8b8ab7e90cb1a6f2a4f809d6709c7eb62a413bdfb84f966832a075f4e4e4",
            "0x1f8205ede46f9b1cd2bb5d0f0d18e693848acc572c08bd312de5b83c0903cde0",
            "0x3aea1069a51bcd90299edb08a451733591bb49d89d05ab061f7933673466ccee",
            "0x6ead3148a7e9ddc486a0ca0542fa4a73f19558feda0b070d41a5c80573eeb9dc",
            "0x1f3d3cb9dfb4f8b84afce5bab9ed497e4967e37149f9045f96de46cfa7ad0c6f",
          ],
          metadata: {
            GITHUB_CONTRIBUTION_TYPE: "contribution",
            GITHUB_ISSUE_NODE_ID: "123",
            GITHUB_ORGANIZATION_NAME: "test",
            GITHUB_REPOSITORY_NAME: "test",
            GITHUB_USERNAME: "123",
          },
          values: ["test", "test", "123", "123", "contribution"],
        },
        networkId: 100,
        nonce: "28290789875493039658039458533958603742651083423638415458747066904844975862062",
        owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        signature: "0xmocksignature",
        tokenAddress: "0x0000000000000000000000000000000000000003",
        tokenType: "ERC721",
      },
    ]);
  });
});
