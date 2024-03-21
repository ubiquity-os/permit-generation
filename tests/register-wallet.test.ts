import { registerWallet } from "../src/handlers/register-wallet";
import { Context } from "../src/types/context";

describe("registerWallet", () => {
  let context: Context;

  beforeEach(() => {
    context = {
      payload: {
        sender: {
          login: "tester",
          id: 123,
        },
        comment: {
          body: "Sample comment",
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
            getUserIdByWallet: jest.fn(),
            getUserByUsername: jest.fn(),
            getUserById: jest.fn(),
          },
          wallet: {
            upsertWallet: jest.fn().mockImplementation(() => Promise.resolve()),
            getWalletByUserId: jest.fn(),
            getWalletByUsername: jest.fn(),
          },
        },
      },
    } as unknown as Context;
  });

  it("should register wallet address when address is provided", async () => {
    const address = "0x1234567890abcdef";

    expect(await registerWallet(context, address)).toBe(true);
    expect(context.logger.info).toHaveBeenCalledWith("Successfully registered wallet address", {
      sender: "tester",
      address: "0x1234567890abcdef",
    });
    expect(context.adapters.supabase.wallet.upsertWallet).toHaveBeenCalledWith(123, "0x1234567890abcdef");
  });

  it("should skip registration when both address and ENS name are not provided", async () => {
    expect(await registerWallet(context, null)).toBe(false);
    expect(context.logger.info).toHaveBeenCalledWith("Skipping to register a wallet address because both address/ens doesn't exist");
    expect(context.adapters.supabase.wallet.upsertWallet).not.toHaveBeenCalled();
  });

  it("should skip registration when address is null address", async () => {
    expect(await registerWallet(context, "0x0000000000000000000000000000000000000000")).toBe(false);
    expect(context.logger.error).toHaveBeenCalledWith("Skipping to register a wallet address because user is trying to set their address to null address");
    expect(context.adapters.supabase.wallet.upsertWallet).not.toHaveBeenCalled();
  });

  it("should handle error while registering wallet address", async () => {
    const address = "0x1234567890abcdef";
    const error = new Error("An error");
    (context.adapters.supabase.wallet.upsertWallet as jest.Mock).mockRejectedValue(error);

    expect(await registerWallet(context, address)).toBe(false);
    expect(context.logger.error).toHaveBeenCalledWith("Error while registering wallet address", {
      sender: "tester",
      address: "0x1234567890abcdef",
      err: error,
    });
  });

  it("should handle missing address in comment", async () => {
    (context.payload as Context<"issue_comment.created">["payload"]).comment.body = "Sample comment without address";
    expect(await registerWallet(context, null)).toBe(false);
    expect(context.logger.info).toHaveBeenCalledWith("Skipping to register a wallet address because both address/ens doesn't exist");
  });
});
