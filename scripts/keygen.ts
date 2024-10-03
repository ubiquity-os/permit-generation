import sodium from "libsodium-wrappers";

(async () => {
  await sodium.ready;

  const x25519KeyPair = sodium.crypto_box_keypair();

  const x25519PrivateKeyBase64 = sodium.to_base64(x25519KeyPair.privateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  const x25519PublicKey = x25519KeyPair.publicKey;
  console.log("X25519 Private Key (Base64):", x25519PrivateKeyBase64);

  const evmPrivateKey = sodium.randombytes_buf(32);
  console.log("EVM Private Key (Hex):", Buffer.from(evmPrivateKey).toString("hex"));
  const encryptedEvmPrivateKey = sodium.crypto_box_seal(evmPrivateKey, x25519PublicKey);

  const encryptedEvmPrivateKeyBase64 = sodium.to_base64(encryptedEvmPrivateKey, sodium.base64_variants.URLSAFE_NO_PADDING);
  console.log("Encrypted EVM Private Key (Base64):", encryptedEvmPrivateKeyBase64);
  const binaryPrivate = sodium.from_base64(x25519PrivateKeyBase64, sodium.base64_variants.URLSAFE_NO_PADDING);
  console.log("Private(Binary): ", binaryPrivate);
})();
