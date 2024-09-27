const crypto = require("crypto");

// Generate an X25519 key pair
const { privateKey } = crypto.generateKeyPairSync("x25519");

// Export the private key as a raw Buffer
const privateKeyBuffer = privateKey.export({ type: "pkcs8", format: "der" });

// Convert the Buffer to a hexadecimal string
const privateKeyHex = privateKeyBuffer.toString("hex");

console.log("X25519 Private Key (Hex):", privateKeyHex);
