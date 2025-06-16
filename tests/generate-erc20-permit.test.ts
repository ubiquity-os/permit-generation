import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { generateErc20PermitSignature } from "../src";
import { Context } from "../src/types/context";
import { ERC20_REWARD_TOKEN_ADDRESS, SPENDER, mockContext } from "./constants";

describe("generateErc20PermitSignature", () => {
  let context: Context;

  jest.autoMockOn();

  /**
   * 6. **Update Configuration File**
      - Next, take the cipher text, which is the encrypted version of your private key,
      and paste it into your `ubiquibot-config.yaml` file. Look for the field labeled
      `evmEncryptedPrivate` and replace its content with the cipher text.
   */
  // cSpell: disable
  const cypherText =
    "wOzNgt-yKT6oFlOVz5wrBLUSYxAbKGE9Co-yvT8f9lePsx7wJwPVugS9186zdhr1T4UpkpXvq9ii5M-nWfrydMnllSkowH4LirRZsHbvRVSvDoH_uh80p6HpwqDSG3g4Nwx5q0GD3H-ne4vwXMuwWAHd";

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

  beforeEach(() => {
    /**
   * 5. **Update GitHub Secrets**
      - Copy the newly generated private key and update it on your GitHub Actions secret.
      Find the field labeled `x25519_PRIVATE_KEY` and replace its content with your generated x25519 private key.
   */
    // cSpell: ignore bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls
    process.env.X25519_PRIVATE_KEY = "bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls";

    context = {
      ...mockContext,
      config: {
        evmNetworkId: 100,
      },
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

    context.config.evmPrivateEncrypted = cypherText;

    const result = await generateErc20PermitSignature(context, SPENDER, amount, ERC20_REWARD_TOKEN_ADDRESS);

    const expectedResult = {
      tokenType: "ERC20",
      tokenAddress: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      beneficiary: "0xefC0e701A824943b469a694aC564Aa1efF7Ab7dd",
      nonce: "28290789875493039658039458533958603742651083423638415458747066904844975862062",
      deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      amount: "100000000000000000000",
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      signature: "0xf5282034f8f121b03c957f42d178a66346e2a2fda08e07e131eb469970cfb01f46b556b903d9c8d529bb3ce08388b22d6cf4b79154399b8578d423ec7b3389ea1c",
      networkId: 100,
    };

    expect(result).toEqual(expectedResult);
    expect(context.logger.info).toHaveBeenCalledWith("Generated ERC20 permit2 signature", expect.any(Object));
  }, 30000);

  it("should throw error when evmPrivateEncrypted is not defined", async () => {
    const amount = 0;
    const expectedError = "Failed to decrypt a private key: TypeError: input cannot be null or undefined";
    await expect(generateErc20PermitSignature(context, SPENDER, amount, ERC20_REWARD_TOKEN_ADDRESS)).rejects.toThrow(expectedError);
    expect(context.logger.error).toHaveBeenCalledWith(expectedError);
  });

  it("should return error message when no wallet found for user", async () => {
    const amount = 0;
    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(null);

    await expect(async () => {
      await generateErc20PermitSignature(context, SPENDER, amount, ERC20_REWARD_TOKEN_ADDRESS);
    }).rejects.toThrow();

    expect(context.logger.error).toHaveBeenCalledWith("ERC20 Permit generation error: Wallet not found");
  });
});
