import { createClient } from "@supabase/supabase-js";
import manifest from "../manifest.json";
import { createAdapters } from "./adapters";
import { validateAndDecodeSchemas } from "./helpers/validator";
import { plugin } from "./plugin";
import { Env, PermitReward, TokenType } from "./types";
import { getPermitSignatureDetails } from "./handlers/erc20-permits/get-erc20-signature-details";
import { getErc721SignatureDetails } from "./handlers/erc721-permits/get-erc721-signature-details";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/manifest") {
        if (request.method === "GET") {
          return new Response(JSON.stringify(manifest), {
            headers: { "content-type": "application/json" },
          });
        } else if (request.method === "POST") {
          const webhookPayload = await request.json();

          validateAndDecodeSchemas(env, webhookPayload.settings);
          return new Response(JSON.stringify({ message: "Schema is valid" }), { status: 200, headers: { "content-type": "application/json" } });
        }
      }
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: `Only POST requests are supported.` }), {
          status: 405,
          headers: { "content-type": "application/json", Allow: "POST" },
        });
      }
      const contentType = request.headers.get("content-type");
      if (contentType !== "application/json") {
        return new Response(JSON.stringify({ error: `Error: ${contentType} is not a valid content type` }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.pathname === "/generate") {
        const payload = await request.json();
        try {
          const { decodedSettings, decodedEnv } = validateAndDecodeSchemas(env, payload.settings);
          const { permitRequests, evmNetworkId, evmPrivateEncrypted } = decodedSettings;
          const { supabase } = createAdapters(createClient(decodedEnv.SUPABASE_URL, decodedEnv.SUPABASE_KEY));
          const permits: PermitReward[] = [];

          for (const permitRequest of permitRequests) {
            const {
              user: { username, userId },
              amount,
              issueNodeId,
              networkId,
              tokenAddress,
              type,
            } = permitRequest;
            const dbUser = await supabase.user.getUserById(userId);
            if (!dbUser || !dbUser.wallet_id) {
              throw new Error(`User with id ${userId} not found`);
            }
            const walletAddress = await supabase.wallet.getWalletByUserId(dbUser.wallet_id);
            if (!walletAddress) {
              throw new Error(`Wallet not found for user with id ${userId}`);
            }

            switch (type) {
              case "ERC20": {
                const { adminWallet, permitTransferFromData, domain, types, values } = await getPermitSignatureDetails({
                  walletAddress,
                  issueNodeId,
                  evmNetworkId: networkId,
                  evmPrivateEncrypted,
                  userId,
                  tokenAddress,
                  amount,
                });

                try {
                  permits.push({
                    tokenType: TokenType.ERC20,
                    tokenAddress: permitTransferFromData.permitted.token,
                    beneficiary: permitTransferFromData.spender,
                    nonce: permitTransferFromData.nonce.toString(),
                    deadline: permitTransferFromData.deadline.toString(),
                    amount: permitTransferFromData.permitted.amount.toString(),
                    owner: adminWallet.address,
                    signature: await adminWallet._signTypedData(domain, types, values),
                    networkId: evmNetworkId,
                  });
                } catch (error) {
                  console.error(`Failed to sign typed data: ${error}`);
                  throw error;
                }
                break;
              }
              case "ERC721":
                {
                  if (permitRequest.type !== "ERC721") {
                    throw new Error(`Invalid permit type: ${type}`);
                  }

                  const {
                    erc721Request: { contributionType },
                  } = permitRequest;

                  const {
                    adminWallet: erc721AdminWallet,
                    erc721SignatureData,
                    erc721Metadata,
                    signature,
                  } = await getErc721SignatureDetails({
                    walletAddress,
                    issueNodeId,
                    evmNetworkId,
                    contributionType,
                    nftContractAddress: tokenAddress,
                    nftMinterPrivateKey: decodedEnv.NFT_MINTER_PRIVATE_KEY,
                    organizationName: "",
                    repositoryName: "",
                    username: username,
                    /**
                     * Not sure about this. Are ubiquity the NFT minters? if so use this.
                     * evmPrivateEncrypted: await getPrivateKey(evmPrivateEncrypted, logger);
                     */
                    userId,
                  });

                  permits.push({
                    tokenType: TokenType.ERC721,
                    tokenAddress,
                    beneficiary: walletAddress,
                    amount: "1",
                    nonce: erc721SignatureData.nonce.toString(),
                    deadline: erc721SignatureData.deadline.toString(),
                    signature: signature,
                    owner: erc721AdminWallet.address,
                    networkId: evmNetworkId,
                    erc721Request: {
                      keys: erc721SignatureData.keys.map((key) => key.toString()),
                      values: erc721SignatureData.values,
                      metadata: erc721Metadata,
                    },
                  });
                }

                break;
              default:
                console.log(`Invalid permit type: ${type}`);
                continue;
            }

            console.log(`Generated permit for ${username} with type ${type}`);
          }

          return new Response(JSON.stringify(permits), { status: 200, headers: { "content-type": "application/json" } });
        } catch (error) {
          return handleUncaughtError(error);
        }
      } else if (url.pathname === "/") {
        const webhookPayload = await request.json();
        const { decodedSettings, decodedEnv } = validateAndDecodeSchemas(env, webhookPayload.settings);

        webhookPayload.env = decodedEnv;
        webhookPayload.settings = decodedSettings;
        await plugin(webhookPayload, decodedEnv);
        return new Response(JSON.stringify("OK"), { status: 200, headers: { "content-type": "application/json" } });
      }
    } catch (error) {
      return handleUncaughtError(error);
    }

    return new Response(JSON.stringify({ error: `Error: ${url.pathname} is not a valid path` }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  },
};

function handleUncaughtError(error: unknown) {
  console.error(error);
  const status = 500;
  return new Response(JSON.stringify({ error }), { status: status, headers: { "content-type": "application/json" } });
}
