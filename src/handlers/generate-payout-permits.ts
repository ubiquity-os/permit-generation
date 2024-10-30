import { PermitReward } from "../types";
import { Context } from "../types/context";
import { logger } from "../helpers/logger";
import { createClient } from "@supabase/supabase-js";
import { createAdapters } from "../adapters";
import { generateErc20Permit } from "./generate-erc20-permit";
import { generateErc721Permit } from "./generate-erc721-permit";

/**
 * Generates a payout permit based on the provided context.
 * @param context - The context object containing the configuration and payload.
 * @param permitRequests
 * @returns A Promise that resolves to the generated permit transaction data or an error message.
 */
export async function generatePayoutPermits({ env, config }: { env: Context["env"]; config: Context["config"] }): Promise<PermitReward[]> {
  const permits: PermitReward[] = [];
  try {
    const { permitRequests, evmPrivateEncrypted } = config;
    const { supabase } = createAdapters(createClient(env.SUPABASE_URL, env.SUPABASE_KEY));

    for (const permitRequest of permitRequests) {
      const { amount, userId, issueNodeId, evmNetworkId, tokenAddress, type: permitType } = permitRequest;
      const dbUser = await supabase.user.getUserById(userId);
      if (!dbUser || !dbUser.wallet_id) {
        throw new Error(`User with id ${userId} not found`);
      }
      const walletAddress = await supabase.wallet.getWalletByUserId(dbUser.wallet_id);
      if (!walletAddress) {
        throw new Error(`Wallet not found for user with id ${userId}`);
      }

      if (!walletAddress) {
        logger.error("ERC20 Permit generation error: Wallet not found");
        throw new Error("Wallet not found");
      }

      switch (permitType) {
        case "ERC20": {
          permits.push(
            await generateErc20Permit({
              amount,
              evmNetworkId,
              evmPrivateEncrypted,
              issueNodeId,
              tokenAddress,
              userId,
              walletAddress,
            })
          );
          break;
        }
        case "ERC721":
          permits.push(
            await generateErc721Permit({
              env,
              evmNetworkId,
              issueNodeId,
              permitRequest,
              tokenAddress,
              userId,
              walletAddress,
            })
          );
          break;
        default:
          throw new Error(logger.error(`Invalid permit type: ${permitType}`).logMessage.raw);
      }
    }

    console.log(`Generated ${permits.length} permits`);
  } catch (error) {
    logger.error(`Failed to generate permit: `, { er: String(error) });
    throw error;
  }

  return permits;
}
