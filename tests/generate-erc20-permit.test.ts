import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { Context } from "../src/types/context";
import { mockContext, ERC20_REWARD_TOKEN_ADDRESS } from "./constants";
import { generateErc20Permit } from "../src/handlers/generate-erc20-permit";
import { generatePayoutPermits } from "../src";
import { logger } from "../src/helpers/logger";
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

describe("generateErc20PermitSignature", () => {
  let context: Context;

  /**
   * 6. **Update Configuration File**
      - Next, take the cipher text, which is the encrypted version of your private key,
      and paste it into your `ubiquibot-config.yaml` file. Look for the field labeled
      `evmEncryptedPrivate` and replace its content with the cipher text.
   */
  // cSpell: disable
  const cypherText =
    "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

  beforeEach(() => {
    /**
   * 5. **Update GitHub Secrets**
      - Copy the newly generated private key and update it on your GitHub Actions secret.
      Find the field labeled `x25519_PRIVATE_KEY` and replace its content with your generated x25519 private key.
   */
    // cSpell: ignore bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls
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

  it("should generate ERC20 permit signature", async () => {
    const amount = 100;

    // context, SPENDER, amount, ERC20_REWARD_TOKEN_ADDRESS
    const result = await generateErc20Permit({
      amount,
      evmNetworkId: 100,
      evmPrivateEncrypted: cypherText,
      nonce: "123",
      tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
      userId: 123,
      walletAddress: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      x25519privateKey: context.env.X25519_PRIVATE_KEY,
    });

    const expectedResult = {
      tokenType: "ERC20",
      tokenAddress: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      beneficiary: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      nonce: "28290789875493039658039458533958603742651083423638415458747066904844975862062",
      deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      amount: "100000000000000000000",
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      signature: "0xad87653fb0ecf740c73b78a8f414cdd5b1ffb18670cde5a1d21c65e43d6bb2a36c5470c5529334dc11566f0c380889b734a8539d69ec74cc2abf37af0ea7a7781b",
      networkId: 100,
    };
    expect(result).toEqual(expectedResult);
  });

  it("should throw error when evmPrivateEncrypted is not defined", async () => {
    const amount = 0;
    const expectedError = "Failed to decrypt a private key: TypeError: input cannot be null or undefined";
    const loggerSpy = jest.spyOn(logger, "error");
    await expect(
      generateErc20Permit({
        amount,
        evmNetworkId: 100,
        evmPrivateEncrypted: "",
        nonce: "123",
        tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
        userId: 123,
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        x25519privateKey: context.env.X25519_PRIVATE_KEY,
      })
    ).rejects.toThrow(expectedError);
    expect(loggerSpy).toHaveBeenCalledWith("Failed to decrypt a private key: TypeError: input cannot be null or undefined");
  });

  it("should return error message when no wallet found for user", async () => {
    const amount = 0;
    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(null);
    const loggerSpy = jest.spyOn(logger, "error");

    await expect(async () => {
      await generatePayoutPermits({
        config: {
          ...context.config,
          evmPrivateEncrypted: cypherText,
          permitRequests: [
            {
              type: "ERC20",
              amount,
              evmNetworkId: 100,
              userId: 123,
              nonce: "123",
              tokenAddress: ERC20_REWARD_TOKEN_ADDRESS,
            },
          ],
        },
        env: context.env,
        adapters: context.adapters,
      });
    }).rejects.toThrow("Wallet not found for user with id 123");

    expect(loggerSpy).toHaveBeenCalledWith("Failed to generate permit: ", { er: "Error: Wallet not found for user with id 123", caller: "_Logs.<anonymous>" });
  });
});
