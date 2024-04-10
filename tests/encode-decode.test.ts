import { describe, expect, it } from "@jest/globals";
import { decodePermits, encodePermits, Permit, TokenType } from "../src";

describe("Encoding / Decoding tests", () => {
  it("Should properly encode and decode a list of permits", () => {
    const permitErc20: Permit = {
      beneficiary: "ubiquity",
      deadline: "1",
      networkId: 100,
      nonce: "0x1",
      owner: "0x1",
      signature: "0x1",
      tokenAddress: "0x1",
      tokenType: TokenType.ERC20,
      amount: 100,
    };
    const permitErc721: Permit = {
      beneficiary: "ubiquity2",
      deadline: "2",
      networkId: 101,
      nonce: "0x2",
      owner: "0x2",
      signature: "0x2",
      tokenAddress: "0x2",
      tokenType: TokenType.ERC721,
      amount: 101.5,
      erc721Request: {
        metadata: {
          GITHUB_ORGANIZATION_NAME: "",
          GITHUB_REPOSITORY_NAME: "",
          GITHUB_ISSUE_ID: "",
          GITHUB_USERNAME: "",
          GITHUB_CONTRIBUTION_TYPE: "",
        },
        keys: ["a", "b"],
        values: ["c", "d"],
      },
    };
    const encoded = encodePermits([permitErc20, permitErc721]);
    const decoded = decodePermits(encoded);
    expect(decoded).toEqual([permitErc20, permitErc721]);
  });
});
