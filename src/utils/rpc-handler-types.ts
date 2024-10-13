export interface ChainData {
  name: string;
  chain: string;
  icon?: string;
  rpc: string[];
  features?: Feature[];
  faucets?: string[];
  nativeCurrency?: Currency;
  infoURL?: string;
  shortName?: string;
  chainId: number;
  networkId?: number;
  slip44?: number;
  ens?: { registry: string };
  explorers?: Explorer[];
  title?: string;
  status?: string;
  redFlags?: string[];
  parent?: ParentChain;
}

export interface Feature {
  name: string;
}

export interface Currency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface Explorer {
  name: string;
  url: string;
  standard: string;
  icon?: string;
}

export interface ParentChain {
  type: string;
  chain: string;
  bridges: { url: string }[];
}

export interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Browser storage implementation
export class BrowserStorage implements StorageInterface {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}

// Node.js storage implementation (in-memory)
export class NodeStorage implements StorageInterface {
  private _store: { [key: string]: string } = {};
  getItem(key: string): string | null {
    return this._store[key] || null;
  }
  setItem(key: string, value: string): void {
    this._store[key] = value;
  }
}

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}
