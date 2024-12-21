// plugin - interfaces

export interface PluginInput {
  eventContext: EventContext;
  inputValue: string; // selialized JSON or simple string parameters
  metadata?: Record<string, unknown>; // optional meradata for additional context
}

export interface EventContext {
  eventName: string;
  payload: Record<string, unknown>;
  config: record<strin, unknown>;
  env: Record<string, string>;
}

export interface Reward {
  type: "ERC20" | "ERC721";
  amount: number;
  tokenAddress: string;
  beneficiary: string;
}


