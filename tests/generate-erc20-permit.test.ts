import { generateErc20PermitSignature } from "../src";
import { Context } from "../src/types/context";
import { SPENDER, mockContext } from "./constants";
import { describe, expect, it, beforeEach, jest } from "@jest/globals";

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
        users: {
          getByUsername: jest.fn().mockReturnValue({ data: { id: 123 } }),
        },
      },
    } as unknown as Context;
  });

  it("should generate ERC20 permit signature", async () => {
    const amount = 100;

    context.config.evmPrivateEncrypted = cypherText;

    const result = await generateErc20PermitSignature(context, SPENDER, amount);

    expect(result).toBeDefined();
    expect(result).not.toContain("Permit not generated");
    expect(result).toBeInstanceOf(Object);
    expect(context.logger.info).toHaveBeenCalledWith("Generated ERC20 permit2 signature", expect.any(Object));
  });

  it("should throw error when evmPrivateEncrypted is not defined", async () => {
    const amount = 0;

    await expect(generateErc20PermitSignature(context, SPENDER, amount)).rejects.toThrow("Private key is not defined");
    expect(context.logger.fatal).toHaveBeenCalledWith("Private key is not defined");
  });

  it("should return error message when no wallet found for user", async () => {
    const amount = 0;
    context.config.evmPrivateEncrypted = cypherText;

    (context.adapters.supabase.wallet.getWalletByUserId as jest.Mock).mockReturnValue(null);

    await expect(async () => {
      await generateErc20PermitSignature(context, SPENDER, amount);
    }).rejects.toThrow();

    expect(context.logger.error).toHaveBeenCalledWith("ERC20 Permit generation error: Wallet not found");
  });
});
