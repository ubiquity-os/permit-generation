import { Context } from "../src/types/context";
import { jest } from "@jest/globals";

export const NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
export const SPENDER = "123";

export const WALLET_ADDRESS = "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd";

// cSpell: disable
export const cypherText =
  "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

export const mockContext = {
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
  logger: {
    info: jest.fn(),
    fatal: jest.fn(),
    error: jest.fn(),
  },
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
