export type BotConfig = {
  keys: {
    evmPrivateEncrypted?: string;
    openAi?: string;
  };
  features: {
    assistivePricing: boolean;
    defaultLabels: string[];
    newContributorGreeting: {
      enabled: boolean;
      header: string;
      displayHelpMenu: boolean;
      footer: string;
    };
    publicAccessControl: {
      setLabel: boolean;
      fundExternalClosedIssue: boolean;
    };
    isNftRewardEnabled: boolean;
  };
  timers: {
    reviewDelayTolerance: number;
    taskStaleTimeoutDuration: number;
    taskFollowUpDuration: number;
    taskDisqualifyDuration: number;
  };
  payments: {
    maxPermitPrice: number;
    evmNetworkId: number;
    basePriceMultiplier: number;
    issueCreatorMultiplier: number;
  };
  disabledCommands: string[];
  incentives: {
    comment: {
      elements: Record<keyof HTMLElementTagNameMap, number>;
      totals: {
        character: number;
        word: number;
        sentence: number;
        paragraph: number;
        comment: number;
      };
    };
  };
  labels: {
    time: string[];
    priority: string[];
  };
  miscellaneous: {
    maxConcurrentTasks: number;
    promotionComment: string;
    registerWalletWithVerification: boolean;
    openAiTokenLimit: number;
  };
};
