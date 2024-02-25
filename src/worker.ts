import Decimal from "decimal.js";
import { configGenerator } from "@ubiquibot/configuration";
import { generateErc20PermitSignature } from "./generate-erc20-permit-signature";
import { generateErc721PermitSignature } from "./generate-erc721-permit-signature";

// @ts-expect-error globalThis
globalThis.window = undefined;
// @ts-expect-error globalThis
globalThis.importScripts = undefined;

/**
 * Encryption happens through pay.ubq.fi/keygen using libsodium
 * Libsodium does not want to play ball with the worker environment
 * I've tried the various sumo and non-sumo versions of the library
 * wrappers and the native version. None of them have worked.
 *
 * So with a little bit of hacking, I've managed to get the encryption
 * to work by using a blend of tweetnacl and libsodium.
 *
 * libsodium seals a box using the the ephemeral pubKey and the recipient's
 * to create a nonce only for that one operation. The epk is included in the
 * ciphertext for decrypting, the first 32 bytes of the ciphertext followed by
 * the actual encrypted message.
 *
 * The nonce is derived from the epk and the recipient's public key using blake2b
 * which is the same as the libsodium implementation.
 *
 * The decrypted message is then used as the private key for the bot wallet.
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const config = await configGenerator();

    const body = await request.json();

    if (body.organizationName) {
      try {
        const signature = await generateErc721PermitSignature({
          organizationName: body.organizationName,
          repositoryName: body.repositoryName,
          issueId: body.issueId.toString(),
          issueNumber: body.issueNumber,
          beneficiary: body.beneficiary,
          username: body.username,
          userId: body.userId,
          contributionType: body.contributionType,
          networkId: config.payments.evmNetworkId,
        });
        return new Response(JSON.stringify({ signature }), { status: 200, headers: { "content-type": "application/json" } });
      } catch (err) {
        console.log("Generating ERC721 failed: ", err);
      }
    } else {
      try {
        const signature = await generateErc20PermitSignature({
          beneficiary: body.beneficiary,
          amount: new Decimal(body.amount),
          userId: body.userId,
          issueId: body.issueId,
          config,
        });
        return new Response(JSON.stringify({ signature }), { status: 200, headers: { "content-type": "application/json" } });
      } catch (err) {
        console.log("Generating ERC20 failed: ", err);
      }
    }

    return new Response(JSON.stringify({ error: "Failed to generate signature" }), { status: 500, headers: { "content-type": "application/json" } });
  },
};
