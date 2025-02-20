import { PermitReward } from "../types";
import { Context } from "../types/context";
import { logger } from "../helpers/logger";
import { generateErc20Permit } from "./generate-erc20-permit";
import { generateErc721Permit } from "./generate-erc721-permit";

/**
 * Generates a payout permit based on the provided context.
 * @param context - The context object containing the configuration and payload.
 * @param permitRequests
 * @returns A Promise that resolves to the generated permit transaction data or an error message.
 */
export async function generatePayoutPermits({
  env,
  config,
  adapters,
}: {
  env: Context["env"];
  config: Context["config"];
  adapters: Context["adapters"];
}): Promise<PermitReward[]> {
  const permits: PermitReward[] = [];
  try {
    const { permitRequests, evmPrivateEncrypted } = config;
    const { supabase } = adapters;

    logger.info(`Generating ${permitRequests.length} permits`);
    for (const permitRequest of permitRequests) {
      logger.info("Generating permit for: ", permitRequest);
      const { amount, userId, nonce, evmNetworkId, tokenAddress, type: permitType } = permitRequest;
      const walletAddress = await supabase.wallet.getWalletByUserId(userId);
      if (!walletAddress) {
        throw new Error(`Wallet not found for user with id ${userId}`);
      }

      switch (permitType) {
        case "ERC20": {
          permits.push(
            await generateErc20Permit({
              amount,
              evmNetworkId,
              evmPrivateEncrypted,
              nonce,
              tokenAddress,
              userId,
              walletAddress,
              x25519privateKey: env.X25519_PRIVATE_KEY,
            })
          );
          logger.ok("Generated ERC20 permit", { permit: permits[permits.length - 1] });
          break;
        }
        case "ERC721":
          permits.push(
            await generateErc721Permit({
              env,
              permitRequest,
              walletAddress,
            })
          );
          logger.ok("Generated ERC721 permit", { permit: permits[permits.length - 1] });
          break;
        default:
          throw new Error(logger.error(`Invalid permit type: ${permitType}`).logMessage.raw);
      }
    }

    logger.info(`Generated ${permits.length} permits`);
  } catch (error) {
    logger.error(`Failed to generate permit: `, { er: String(error) });
    throw error;
  }

  logger.info("Generated permits: ", { permits });

  return permits;
}
