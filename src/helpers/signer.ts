
import { ethers } from "ethers";
import { decrypt, parseDecryptedPrivateKey } from "../utils";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";

export async function getPrivateKey(evmPrivateEncrypted: string, logger: Logs) {
    try {
        const privateKeyDecrypted = await decrypt(evmPrivateEncrypted, String(process.env.X25519_PRIVATE_KEY));
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

export async function getAdminWallet(privateKey: string, provider: ethers.providers.Provider, logger: Logs) {
    try {
        return new ethers.Wallet(privateKey, provider);
    } catch (error) {
        const errorMessage = `Failed to instantiate wallet: ${error}`;
        logger.debug(errorMessage);
        throw new Error(errorMessage);
    }
}