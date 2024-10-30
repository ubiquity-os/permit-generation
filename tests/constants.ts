import { Octokit } from "@octokit/rest";
import { Context, SupportedEventsU } from "../src/types/context";
import { jest } from "@jest/globals";
import { logger } from "../src/helpers/logger";

export const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
export const SPENDER = "123";
export const ERC20_REWARD_TOKEN_ADDRESS = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"; // WXDAI

export const WALLET_ADDRESS = "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd";

// cSpell: disable
export const cypherText =
  "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

export const mockContext = {
  config: {
    evmNetworkId: 100,
    evmPrivateEncrypted: cypherText,
    permitRequests: [
      {
        amount: 100,
        issueNodeId: "123",
        networkId: 100,
        tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
        type: "ERC20",
        user: { userId: 123, username: "tester" },
      },
    ],
  },
  env: {
    GITHUB_TOKEN: "123",
    NFT_CONTRACT_ADDRESS,
    NFT_MINTER_PRIVATE_KEY: "123",
    SUPABASE_KEY: "123",
    SUPABASE_URL: "http://localhost:8080",
  },
  eventName: "doesn't really matter" as SupportedEventsU,
  octokit: {} as Octokit,
  payload: {
    sender: {
      login: "tester",
      id: 123,
    },
    comment: {
      body: "Sample comment",
    },
    issue: {
      number: 123,
      id: 123,
      node_id: "123",
    },
    pull_request: {
      number: 123,
    },
    repository: {
      owner: {
        login: "test",
      },
      name: "test",
    },
  },
  logger: logger,
  adapters: {
    supabase: {
      user: {
        deleteUser: jest.fn(),
        upsertUser: jest.fn(),
        getUserIdByWallet: jest.fn().mockReturnValue(123),
        getUserIdByUsername: jest.fn().mockReturnValue(1),
        getUserById: jest.fn(),
      },
      wallet: {
        upsertWallet: jest.fn().mockImplementation(() => Promise.resolve()),
        getWalletByUserId: jest.fn().mockReturnValue(WALLET_ADDRESS),
        getWalletByUsername: jest.fn().mockReturnValue(WALLET_ADDRESS),
      },
    },
  },
} as unknown as Context;
