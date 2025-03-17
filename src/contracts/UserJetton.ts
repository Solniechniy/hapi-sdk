import { Address, Cell, Contract, ContractProvider } from "@ton/core";

import { ContractAdapter } from "@ton-api/ton-adapter";

export class UserTonJetton implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(address: Address, contractAdapter: ContractAdapter) {
    return contractAdapter.open(new UserTonJetton(address));
  }

  async getBalance(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get("get_smc_balance", []);
    return result.stack.readBigNumber();
  }

  async getOwner(provider: ContractProvider): Promise<Address> {
    const result = await provider.get("get_owner", []);
    return result.stack.readAddress();
  }
  async getAttestationAddress(provider: ContractProvider): Promise<Address> {
    const result = await provider.get("get_attestation_address", []);
    return result.stack.readAddress();
  }

  async getTrustScore(provider: ContractProvider): Promise<number> {
    const result = await provider.get("get_trust_score", []);
    return result.stack.readNumber();
  }

  async getExpirationDate(provider: ContractProvider): Promise<number> {
    const result = await provider.get("get_expiration_date", []);
    return result.stack.readNumber();
  }

  async getAttestationData(provider: ContractProvider) {
    const res = await provider.get("get_user_data", []);
    const commissionOwner = res.stack.readAddress();
    const trustScore = res.stack.readBigNumber();
    const expirationDate = res.stack.readBigNumber();
    const attestationAddress = res.stack.readAddress();
    return {
      commissionOwner,
      trustScore,
      expirationDate,
      attestationAddress,
    };
  }
}
