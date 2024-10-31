import { ethers } from "ethers";
import { decrypt, parseDecryptedPrivateKey } from "../utils";
import { logger } from "./logger";

export async function getPrivateKey(evmPrivateEncrypted: string, x25519privateKey: string) {
  try {
    const privateKeyDecrypted = await decrypt(evmPrivateEncrypted, x25519privateKey);
    const privateKeyParsed = parseDecryptedPrivateKey(privateKeyDecrypted);
    const privateKey = privateKeyParsed.privateKey;
    if (!privateKey) throw new Error("Private key is not defined");
    return privateKey;
  } catch (error) {
    const errorMessage = `Failed to decrypt a private key: ${error}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getAdminWallet(privateKey: string, provider: ethers.providers.Provider) {
  try {
    return new ethers.Wallet(privateKey, provider);
  } catch (error) {
    const errorMessage = `Failed to instantiate wallet: ${error}`;
    logger.debug(errorMessage);
    throw new Error(errorMessage);
  }
}
