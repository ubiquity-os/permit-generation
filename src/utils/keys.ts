import sodium from "libsodium-wrappers";

/**
 * Decrypts encrypted text with provided "X25519_PRIVATE_KEY" value
 * @param encryptedText Encrypted text
 * @param x25519PrivateKey "X25519_PRIVATE_KEY" private key
 * @returns Decrypted text
 */
export async function decrypt(encryptedText: string, x25519PrivateKey: string): Promise<string> {
  await sodium.ready;

  const publicKey = await getPublicKey(x25519PrivateKey);

  const binaryPublic = sodium.from_base64(publicKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  const binaryPrivate = sodium.from_base64(x25519PrivateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  const binaryEncryptedText = sodium.from_base64(encryptedText, sodium.base64_variants.URLSAFE_NO_PADDING);

  return sodium.crypto_box_seal_open(binaryEncryptedText, binaryPublic, binaryPrivate, "text");
}

/**
 * Returns public key from provided "X25519_PRIVATE_KEY" value
 * @param x25519PrivateKey "X25519_PRIVATE_KEY" private key
 * @returns Public key
 */
export async function getPublicKey(x25519PrivateKey: string): Promise<string> {
  await sodium.ready;
  const binaryPrivate = sodium.from_base64(x25519PrivateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  return sodium.crypto_scalarmult_base(binaryPrivate, "base64");
}

/**
 * Parses partner's private key into object with properties:
 * 1. Private key
 * 2. Organization id where this private key is allowed to be used
 * 3. Repository id where this private key is allowed to be used
 *
 * The issue with "plain" encryption of wallet private keys is that if partner accidentally shares
 * his encrypted private key then a malicious user will be able to use that leaked private key
 * in another organization with permits generated from a leaked partner's wallet.
 *
 * Partner private key (`evmPrivateEncrypted` config param in `conversation-rewards` plugin) supports 3 formats:
 * 1. PRIVATE_KEY
 * 2. PRIVATE_KEY:GITHUB_ORGANIZATION_ID
 * 3. PRIVATE_KEY:GITHUB_ORGANIZATION_ID:GITHUB_REPOSITORY_ID
 *
 * Format "PRIVATE_KEY" can be used only for `ubiquity` and `ubiquibot` organizations. It is
 * kept for backwards compatibility in order not to update private key formats for our existing
 * values set in the `evmPrivateEncrypted` param.
 *
 * Format "PRIVATE_KEY:GITHUB_ORGANIZATION_ID" restricts in which particular organization this private
 * key can be used. It can be set either in the organization wide config either in the repository wide one.
 *
 * Format "PRIVATE_KEY:GITHUB_ORGANIZATION_ID:GITHUB_REPOSITORY_ID" restricts organization and a particular
 * repository where private key is allowed to be used.
 *
 * @param decryptedPrivateKey Decrypted private key string (in any of the 3 different formats)
 * @returns Parsed private key object: private key, organization id and repository id
 */
export function parseDecryptedPrivateKey(decryptedPrivateKey: string) {
  const result: {
    privateKey: string | null;
    allowedOrganizationId: number | null;
    allowedRepositoryId: number | null;
  } = {
    privateKey: null,
    allowedOrganizationId: null,
    allowedRepositoryId: null,
  };

  // split private key
  const privateKeyParts = decryptedPrivateKey.split(":");

  // Plain private key.
  // Format: "PRIVATE_KEY".
  // Used for backwards compatibility with ubiquity related organizations:
  // - https://github.com/ubiquity
  // - https://github.com/ubiquibot
  if (privateKeyParts.length === 1) {
    result.privateKey = privateKeyParts[0];
  }

  // Private key + allowed organization id.
  // Format: "PRIVATE_KEY:GITHUB_ORGANIZATION_ID"
  if (privateKeyParts.length === 2) {
    result.privateKey = privateKeyParts[0];
    result.allowedOrganizationId = Number(privateKeyParts[1]);
  }

  // Private key + allowed organization id + allowed repository id.
  // Format: "PRIVATE_KEY:GITHUB_ORGANIZATION_ID:GITHUB_REPOSITORY_ID"
  if (privateKeyParts.length === 3) {
    result.privateKey = privateKeyParts[0];
    result.allowedOrganizationId = Number(privateKeyParts[1]);
    result.allowedRepositoryId = Number(privateKeyParts[2]);
  }

  return result;
}
