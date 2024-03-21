import { constants, ethers } from "ethers";
import { Context } from "../types/context";

export async function registerWallet(context: Context, address: string | null) {
  const payload = context.payload as Context<"issue_comment.created">["payload"];
  const logger = context.logger;
  const sender = payload.sender.login;
  const senderID = payload.sender.id;
  const body = payload.comment.body;
  const adapters = context.adapters;

  const ensName = extractEnsName(body.replace("/wallet", "").trim());

  if (!address && ensName) {
    logger.info("Trying to resolve address from ENS name", { ensName });
    address = await resolveAddress(ensName);
    if (!address) {
      logger.fatal("Resolving address from ENS name failed", { ensName });
      return false;
    }
    logger.info("Resolved address from ENS name", { ensName, address });
  }

  if (!address) {
    logger.info("Skipping to register a wallet address because both address/ens doesn't exist");
    return false;
  }

  if (address == constants.AddressZero) {
    logger.error("Skipping to register a wallet address because user is trying to set their address to null address");
    return false;
  }

  if (address && senderID) {
    const { wallet, user } = adapters.supabase;
    const userRecord = await user.getUserById(senderID);

    try {
      if (!userRecord || userRecord.length === 0) {
        await user.upsertUser(senderID, sender);
        await wallet.upsertWallet(senderID, address);
      } else {
        await wallet.upsertWallet(senderID, address);
      }

      logger.info("Successfully registered wallet address", { sender, address });
      return true;
    } catch (err) {
      logger.error("Error while registering wallet address", { sender, address, err });
    }
  } else {
    logger.error(`No address found in comment: ${body}`);
  }

  return false;
}

export async function resolveAddress(ensName: string): Promise<string | null> {
  // Gets the Ethereum address associated with an ENS (Ethereum Name Service) name
  // Explicitly set provider to Ethereum mainnet
  const provider = new ethers.providers.JsonRpcProvider(`https://eth.llamarpc.com`); // mainnet required for ENS
  return await provider.resolveName(ensName).catch((err) => {
    console.trace({ err });
    return null;
  });
}

// Extracts ensname from raw text.
function extractEnsName(text: string) {
  // Define a regular expression to match ENS names
  const ensRegex = /^(?=.{3,40}$)([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/gm;

  // Find the first match of the regular expression in the input text
  const match = text.match(ensRegex);

  if (match) {
    const ensName = match[0];
    return ensName.toLowerCase();
  }
}
