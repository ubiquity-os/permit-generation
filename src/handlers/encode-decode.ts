import { Permit, TokenType } from "../types";

/**
 * Returns a base64 encoded string containing all the permit data
 */
export function encodePermits(permits: Permit[]) {
  return Buffer.from(
    JSON.stringify(
      permits.map((permit) => {
        if (permit.tokenType === TokenType.ERC20) {
          return {
            type: "erc20-permit",
            permit: {
              permitted: {
                token: permit.tokenAddress,
                amount: permit.amount,
              },
              nonce: permit.nonce,
              deadline: permit.deadline,
            },
            transferDetails: {
              to: permit.beneficiary,
              requestedAmount: permit.amount,
            },
            owner: permit.owner,
            signature: permit.signature,
            networkId: permit.networkId,
          };
        } else {
          return {
            type: "erc721-permit",
            permit: {
              permitted: {
                token: permit.tokenAddress,
                amount: permit.amount,
              },
              nonce: permit.nonce,
              deadline: permit.deadline,
            },
            transferDetails: {
              to: permit.beneficiary,
              requestedAmount: permit.amount,
            },
            owner: permit.owner,
            signature: permit.signature,
            networkId: permit.networkId,
            nftMetadata: permit.erc721Request?.metadata,
            request: {
              beneficiary: permit.beneficiary,
              deadline: permit.deadline,
              keys: permit.erc721Request?.keys,
              nonce: permit.nonce,
              values: permit.erc721Request?.values,
            },
          };
        }
      })
    )
  ).toString("base64");
}

export function decodePermits(base64: string) {
  return JSON.parse(atob(base64)) as Permit[];
}
