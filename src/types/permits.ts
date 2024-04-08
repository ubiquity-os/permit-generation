export enum TokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}

export interface Permit {
  tokenType: TokenType;
  tokenAddress: string;
  beneficiary: string;
  amount: string;
  nonce: string;
  deadline: string;
  owner: string;
  signature: string;
  networkId: number;
  erc721Request?: {
    keys: string[];
    values: string[];
    metadata: {
      GITHUB_ORGANIZATION_NAME: string;
      GITHUB_REPOSITORY_NAME: string;
      GITHUB_ISSUE_ID: string;
      GITHUB_USERNAME: string;
      GITHUB_CONTRIBUTION_TYPE: string;
    };
  };
}
