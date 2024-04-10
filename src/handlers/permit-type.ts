import { Static, Type } from "@sinclair/typebox";

const permit = Type.Object({
  permitted: Type.Object({
    token: Type.String(),
    amount: Type.String(),
  }),
  nonce: Type.String(),
  deadline: Type.String(),
});

const transferDetails = Type.Object({
  to: Type.String(),
  requestedAmount: Type.String(),
});

const metadata = Type.Object({
  GITHUB_ORGANIZATION_NAME: Type.String(),
  GITHUB_REPOSITORY_NAME: Type.String(),
  GITHUB_ISSUE_ID: Type.String(),
  GITHUB_USERNAME: Type.String(),
  GITHUB_CONTRIBUTION_TYPE: Type.String(),
});

const permitType = Type.Union([Type.Literal("erc20-permit"), Type.Literal("erc721-permit")]);

const request = Type.Object({
  beneficiary: Type.String(),
  deadline: Type.String(),
  keys: Type.Optional(Type.Array(Type.String())),
  nonce: Type.String(),
  values: Type.Optional(Type.Array(Type.String())),
});

const ercPermit = Type.Object({
  type: permitType,
  permit: permit,
  transferDetails: transferDetails,
  owner: Type.String(),
  signature: Type.String(),
  networkId: Type.Number(),
  nftMetadata: Type.Optional(metadata),
  request: Type.Optional(request),
});

type ErcPermitType = Static<typeof ercPermit>;

export default ErcPermitType;
