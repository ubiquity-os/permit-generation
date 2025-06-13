import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { Context } from "../src/types/context";
import { mockContext, ERC20_REWARD_TOKEN_ADDRESS, WALLET_ADDRESS } from "./constants";
import { generateErc20Permit } from "../src/handlers/generate-erc20-permit";
import { generatePayoutPermit, PermitRequest } from "../src";
import "@supabase/supabase-js";
import { LogReturn } from "@ubiquity-os/ubiquity-os-logger";

jest.autoMockOn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }),
}));

jest.mock("../src/utils/get-fastest-provider", () => {
  const module = jest.requireActual("../src/utils/get-fastest-provider") as typeof import("../src/utils/get-fastest-provider");
  return {
    getHandler: (networkId: number | null) => {
      return !networkId ? null : module.getHandler(31337);
    },
    getFastestProvider: async (networkId: number | null) => {
      return !networkId ? null : await module.getFastestProvider(31337);
    },
  };
});

describe("generateErc20PermitSignature", () => {
  let context: Context;
  let cypherText: string;

  /**
   * 6. **Update Configuration File**
      - Next, take the cipher text, which is the encrypted version of your private key,
      and paste it into your `ubiquibot-config.yaml` file. Look for the field labeled
      `evmEncryptedPrivate` and replace its content with the cipher text.
   */

  beforeEach(() => {
    // cSpell: disable
    cypherText =
      "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

    /**
   * 5. **Update GitHub Secrets**
      - Copy the newly generated private key and update it on your GitHub Actions secret.
      Find the field labeled `x25519_PRIVATE_KEY` and replace its content with your generated x25519 private key.
   */
    context = {
      ...mockContext,
      octokit: {
        request() {
          return { data: { id: 1, login: "123" } };
        },
        rest: {
          users: {
            getByUsername: jest.fn().mockReturnValue({ data: { id: 123 } }),
          },
        },
      },
    } as unknown as Context;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate ERC20 permit signature", async () => {
    const amount = 100;
    await expect(
      generateErc20Permit({
        amount,
        evmNetworkId: 100,
        evmPrivateEncrypted: cypherText,
        nonce: "123",
        tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
        userId: 123,
        userWalletAddress: WALLET_ADDRESS,
        x25519privateKey: context.env.X25519_PRIVATE_KEY,
      })
    ).resolves.toEqual({
      tokenType: "ERC20",
      tokenAddress: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      beneficiary: WALLET_ADDRESS,
      nonce: "28290789875493039658039458533958603742651083423638415458747066904844975862062",
      deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      amount: "100000000000000000000",
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      signature: "0xad87653fb0ecf740c73b78a8f414cdd5b1ffb18670cde5a1d21c65e43d6bb2a36c5470c5529334dc11566f0c380889b734a8539d69ec74cc2abf37af0ea7a7781b",
      networkId: 100,
    });
  }, 36000);

  it("should throw error when evmPrivateEncrypted is not defined", async () => {
    const amount = 0;
    await expect(
      generateErc20Permit({
        amount,
        evmNetworkId: 100,
        evmPrivateEncrypted: "",
        nonce: "123",
        tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
        userId: 123,
        userWalletAddress: WALLET_ADDRESS,
        x25519privateKey: context.env.X25519_PRIVATE_KEY,
      })
    ).rejects.toBeInstanceOf(LogReturn);
  }, 36000);

  it("should return error message when no wallet found for user", async () => {
    const permitRequest: PermitRequest = {
      type: "ERC20",
      amount: 0,
      evmNetworkId: 100,
      userId: 123,
      nonce: "123",
      userWalletAddress: null as unknown as string,
      tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
    };

    await expect(
      generatePayoutPermit(
        {
          config: {
            ...context.config,
            evmPrivateEncrypted: cypherText,
            permitRequests: [permitRequest],
          },
          env: context.env,
          adapters: context.adapters,
        } as Context,
        []
      )
    ).rejects.toBeInstanceOf(LogReturn);
  }, 36000);
});
