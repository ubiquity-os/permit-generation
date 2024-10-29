import { PERMIT2_ADDRESS, PermitTransferFrom, SignatureTransfer, MaxUint256 } from "@uniswap/permit2-sdk";
import { utils } from "ethers";
import { Logs } from "@ubiquity-os/ubiquity-os-logger";
import { getFastestProvider } from "../../utils/get-fastest-provider";
import { getAdminWallet, getPrivateKey } from "../../helpers/signer";
import { getTokenDecimals } from "./get-token-decimals";

export async function getPermitSignatureDetails(
  walletAddress: string | null | undefined,
  issueNodeId: string,
  evmNetworkId: number,
  evmPrivateEncrypted: string,
  userId: number,
  tokenAddress: string,
  logger: Logs,
  amount: number
) {
  if (!walletAddress) {
    const errorMessage = "ERC20 Permit generation error: Wallet not found";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  const provider = await getFastestProvider(evmNetworkId);
  if (!provider) {
    logger.error("Provider is not defined");
    throw new Error("Provider is not defined");
  }

  const privateKey = await getPrivateKey(evmPrivateEncrypted, logger);
  const adminWallet = await getAdminWallet(privateKey, provider, logger);
  const tokenDecimals = await getTokenDecimals(tokenAddress, provider, logger);

  const permitTransferFromData: PermitTransferFrom = {
    permitted: {
      token: tokenAddress,
      amount: utils.parseUnits(amount.toString(), tokenDecimals),
    },
    spender: walletAddress,
    nonce: BigInt(utils.keccak256(utils.toUtf8Bytes(`${userId}-${issueNodeId}`))),
    deadline: MaxUint256,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFromData, PERMIT2_ADDRESS, evmNetworkId);
  return { adminWallet, permitTransferFromData, domain, types, values, logger };
}
