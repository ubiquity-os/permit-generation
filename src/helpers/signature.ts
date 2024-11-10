interface Inputs {
  stateId: string;
  eventName: string;
  eventPayload: unknown;
  authToken: string;
  settings: unknown;
  ref: unknown;
}

export async function verifySignature(publicKeyPem: string, inputs: Inputs, signature: string) {
  try {
    const pemContents = publicKeyPem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").trim();
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const publicKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true,
      ["verify"]
    );

    const signatureArray = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const dataArray = new TextEncoder().encode(Buffer.from(JSON.stringify(inputs)).toString("base64"));

    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signatureArray, dataArray);
  } catch (error) {
    console.error(error);
    return false;
  }
}
