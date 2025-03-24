import { ethers } from "ethers";
import { decrypt, parseDecryptedPrivateKey } from "../utils";
import { logger } from "./logger";

export async function getPrivateKey(evmPrivateEncrypted: string, x25519privateKey: string) {
  try {
    const { privateKey: privateKeyDecrypted } = await decrypt(evmPrivateEncrypted, x25519privateKey);
    const privateKeyParsed = parseDecryptedPrivateKey(privateKeyDecrypted);
    const privateKey = privateKeyParsed.privateKey;
    if (!privateKey) throw logger.error("[getPrivateKey] - Private key is not defined");
    return privateKey;
  } catch (error) {
    throw logger.error(`[getPrivateKey] - Failed to decrypt a private key`, { e: error });
  }
}

export async function getAdminWallet(privateKey: string, provider: ethers.providers.Provider) {
  try {
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    throw logger.warn(`[getAdminWallet] - Failed to instantiate wallet`, { e: error });
  }
}
