import { toNano } from "@ton/core";

export const delay = async (time = 1000): Promise<void> => {
  return new Promise((res) => setTimeout(res, time));
};

export const TON_DEFAULT_GAS = toNano("0.05");
export const TON_MIN_COMMISSION = toNano("0.01");
export const TON_MIN_JETTON_STORAGE = toNano("0.001");
