// import { generateErc20PermitSignature } from "../src/handlers/generate-erc20-permit";
// import { generateErc721PermitSignature } from "../src/handlers/generate-erc721-permit";
import { generatePayoutForWorkflowDispatch } from "../src/handlers/generate-payout-permit";
import { Context } from "../src/types/context";
import { unpackInputs } from "../src/utils/helpers";
import { SPENDER, cypherText, mockContext } from "./constants";

jest.mock("../src/utils/helpers");
jest.mock("../src/handlers/generate-erc20-permit");
jest.mock("../src/handlers/generate-erc721-permit");

describe("generatePayoutForWorkflowDispatch", () => {
  let context: Context;

  beforeEach(() => {
    // cSpell: disable
    process.env.X25519_PRIVATE_KEY = "bHH4PDnwb2bsG9nmIu1KeIIX71twQHS-23wCPfKONls";
    process.env.NFT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000003";
    process.env.NFT_MINTER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    context = {
      ...mockContext,
      config: {
        evmNetworkId: 1,
        evmPrivateEncrypted: cypherText,
        isNftRewardEnabled: true,
        nftMinterPrivateKey: process.env.NFT_MINTER_PRIVATE_KEY,
        nftContractAddress: process.env.NFT_CONTRACT_ADDRESS,

        // possible inputs from workflow_dispatch
        token: process.env.NFT_CONTRACT_ADDRESS,
        amount: 100,
        spender: SPENDER,
        userId: 123,

        // nft specific inputs
        contribution_type: "contribution",
        username: "tester",
        issueID: 123,
      },
    } as unknown as Context;
    (unpackInputs as jest.Mock).mockReturnValue({
      erc20: {
        token: "TOKEN_ADDRESS",
        amount: 100,
        spender: SPENDER,
        networkId: 1,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // TODO: valids

  it("should return error message when no config found for permit generation", async () => {
    (unpackInputs as jest.Mock).mockReturnValue({});

    const result = await generatePayoutForWorkflowDispatch(context, false);

    expect(result).toBe("Permit not generated: no config found for permit generation");
    expect(context.logger.error).toHaveBeenCalledWith("No config found for permit generation");
  });

  it("should return error message when no token, amount, spender, or networkId found for ERC20 permit", async () => {
    (unpackInputs as jest.Mock).mockReturnValue({
      erc20: {},
    });

    const result = await generatePayoutForWorkflowDispatch(context, false);

    expect(result).toBe("Permit not generated: no token, amount, spender, or networkId found for ERC20 permit");
    expect(context.logger.error).toHaveBeenCalledWith("No token, amount, spender, or networkId found for ERC20 permit");
  });

  it("should return error message when no username or issueID found for ERC721 permit", async () => {
    (unpackInputs as jest.Mock).mockReturnValue({
      erc721: {},
    });

    const result = await generatePayoutForWorkflowDispatch(context, true);

    expect(result).toBe("Permit not generated: no username or issueID found for ERC721 permit");
    expect(context.logger.error).toHaveBeenCalledWith("No username or issueID found for ERC721 permit");
  });
});
