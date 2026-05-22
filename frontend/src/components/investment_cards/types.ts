export type ConstantKey = "currency" | "exchange" | "platform";
export type ConstantOption = string | [string, string];

export type InvestmentModalConstants = Partial<Record<ConstantKey, ConstantOption[]>> & {
  constants?: string | Partial<Record<ConstantKey, ConstantOption[]>>;
};

export type InvestmentHistoryPoint = {
  date: string;
  volume?: number;
  low?: number;
  high?: number;
  close?: number;
};

export type Investment = {
  id?: string | number;
  symbol: string;
  name: string;
  visible?: boolean;
  units: number;
  average_cost: number;
  total_cost: number;
  last_price: number;
  daily_change: number;
  daily_change_percent: number;
  profit: number;
  profit_percent: number;
  history: InvestmentHistoryPoint[];
};

export const defaultModalConstants: Required<Record<ConstantKey, ConstantOption[]>> = {
  currency: ["AUD"],
  exchange: ["XASX"],
  platform: ["CMC"],
};

export function normaliseModalConstants(
  constants: InvestmentModalConstants | undefined
): Required<Record<ConstantKey, ConstantOption[]>> {
  if (!constants) {
    return defaultModalConstants;
  }

  if (typeof constants.constants === "string") {
    try {
      return { ...defaultModalConstants, ...JSON.parse(constants.constants) };
    } catch {
      return defaultModalConstants;
    }
  }

  return { ...defaultModalConstants, ...constants, ...constants.constants };
}

export function getConstantOptionValue(option: ConstantOption) {
  return Array.isArray(option) ? option[0] : option;
}
