import { Context } from "../src/types/context";

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
    },
    pull_request: {
      number: 123,
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
        getUserIdByUsername: jest.fn(),
        getUsernameById: jest.fn(),
      },
      wallet: {
        upsertWallet: jest.fn().mockImplementation(() => Promise.resolve()),
        getWalletByUserId: jest.fn(),
        getWalletByUsername: jest.fn(),
      },
    },
  },
} as unknown as Context;
