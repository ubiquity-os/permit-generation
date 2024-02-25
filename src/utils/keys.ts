import SODIUM from "libsodium-wrappers-sumo";
import { scalarMult, box } from "tweetnacl";
import tweetnaclUtil from "tweetnacl-util";
// @ts-expect-error no type
import blake2b from "blake2b";

/**
 * libsodium hashes the epk with the rpk to create a nonce
 * tweetnacl enforces you to manually handle the nonce
 * @param epk  The ephemeral public key
 * @param recipientPubKey  The recipient's public key
 * @returns  The derived nonce
 */
function deriveNonce(epk: Uint8Array, recipientPubKey: Uint8Array) {
  return blake2b(24).update(epk).update(recipientPubKey).digest();
}

/**
 * The trouble with libsodium was that it just would not successfully `await sodium.ready` no matter what package I used.
 * So the wrappers-sumo exposes some functions that don't require the ready promise to be resolved.
 * But the heavy lifting like scalarMult and boxes still require the ready promise to be resolved.
 * So a little jiggery-pokery with deriving the nonce that libsodium adds for convenience
 *  and we're good to go
 *
 * whether this is viable in production is another question but it's a start
 */

export async function decryptKeys(cipherText: string): Promise<{ privateKey: string; publicKey: string } | { privateKey: null; publicKey: null }> {
  let _public: null | string = null;
  let _private: null | string = null;
  // this is the evmPrivateEncrypted for 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (anvil acc[1])
  const X25519_PRIVATE_KEY = "TNjblUQ1U959TKGddmNlyOJQ7RMGaqS0XXH185Ei1Ik";

  if (!X25519_PRIVATE_KEY) {
    console.warn("X25519_PRIVATE_KEY is not defined");
    return { privateKey: null, publicKey: null };
  }
  _public = await getScalarKey(X25519_PRIVATE_KEY);

  if (!_public) {
    console.warn("Public key is null");
    return { privateKey: null, publicKey: null };
  }

  const binaryPublic = SODIUM.from_base64(_public, SODIUM.base64_variants.URLSAFE_NO_PADDING);
  const binaryPrivate = SODIUM.from_base64(X25519_PRIVATE_KEY, SODIUM.base64_variants.URLSAFE_NO_PADDING);
  const binaryCipher = SODIUM.from_base64(cipherText, SODIUM.base64_variants.URLSAFE_NO_PADDING);

  const epk = binaryCipher.slice(0, 32);
  const nonce = deriveNonce(epk, binaryPublic);

  const actualEncryptedMessage = binaryCipher.slice(32);
  const decryptedMessage = box.open(actualEncryptedMessage, nonce, epk, binaryPrivate);

  if (decryptedMessage) {
    const decryptedText = tweetnaclUtil.encodeUTF8(decryptedMessage);
    _private = decryptedText;
  } else {
    console.warn("Decryption failed");
    return { privateKey: null, publicKey: null };
  }

  if (!_private) {
    console.warn("Private key is null");
    throw new Error("Private key is null");
  }

  return { privateKey: _private, publicKey: _public };
}

async function getScalarKey(x25519PrivateKey: string) {
  const binPriv = SODIUM.from_base64(x25519PrivateKey, SODIUM.base64_variants.URLSAFE_NO_PADDING);
  return SODIUM.to_base64(scalarMult.base(binPriv), SODIUM.base64_variants.URLSAFE_NO_PADDING);
}
