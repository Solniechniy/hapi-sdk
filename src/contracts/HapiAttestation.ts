import {
  Address,
  Cell,
  Contract,
  ContractProvider,
  SendMode,
  Sender,
  TupleItemSlice,
  beginCell,
  address as toAddress,
} from "@ton/core";

import { config } from "../config";

import { OpCode } from "../types";

import { ContractAdapter } from "@ton-api/ton-adapter";

export class HapiTonAttestation implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromAddress(
    address = config.ton.score,
    contractAdapter: ContractAdapter
  ) {
    return contractAdapter.open(new HapiTonAttestation(toAddress(address)));
  }

  async getCreateAttestationFee(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get("get_create_attestation_fee", []);
    return result.stack.readBigNumber();
  }

  async getUpdateAttestationFee(provider: ContractProvider): Promise<bigint> {
    const result = await provider.get("get_update_attestation_fee", []);
    return result.stack.readBigNumber();
  }

  async getAttestationData(provider: ContractProvider) {
    const res = await provider.get("get_hapi_attestation_data", []);
    const userCount = res.stack.readBigNumber();
    const contractOwner = res.stack.readAddress();
    const commissionOwner = res.stack.readAddress();
    const createAttestatioFee = res.stack.readBigNumber();
    const updateAttestatioFee = res.stack.readBigNumber();
    const walletCode = res.stack.readCell();

    return {
      userCount,
      contractOwner,
      commissionOwner,
      createAttestatioFee,
      updateAttestatioFee,
      walletCode,
    };
  }

  async getUserJettonAddress(
    provider: ContractProvider,
    address: string
  ): Promise<Address> {
    const result = await provider.get("get_user_jetton_address", [
      {
        type: "slice",
        cell: beginCell().storeAddress(toAddress(address)).endCell(),
      } as TupleItemSlice,
    ]);
    return result.stack.readAddress();
  }

  static getStaticUserJettonAddress(address: string): Address {
    const JETTON_WALLET_CODE = Cell.fromBoc(
      Buffer.from(
        "b5ee9c724102140100013b000114ff00f4a413f4bcf2c80b01020120021302014803070202cb040602dfd0ccc7434c0c05c6c2456f80871c02456f83e900c36cf1b088134c7c860842576e74e6ea497c1b81450b1c17cb87d208433e45309eea3ac40b4cfc0407481f4cffe803e900c208203d0901c3ec08076cf08d04d8572140173c584f2c1f2cfc073c5b3327b55007c057817c12103fcbc212050028c8801001cb0558cf1601fa027001cb6ac973fb000049a2e4400800e58280e78b387d013800e5b541086a993b6d80e58f8080e59fe4c080417d80400201480811020120090e0201480a0b0111ae56ed9e08122f8240120201200c0d0110a9d4db3c10345f0412010aa9bfdb3c30120201580f10000fad97fc13b7911840010dacd2ed9e2f824012010fb9996db3c145f04812001aed44d0fa40d207d33ffa40d430000cf230840ff2f0a35e372c",
        "hex"
      )
    )[0];

    const JETTON_MASTER_ADDRESS = Address.parse(config.ton.score);
    const USER_ADDRESS = Address.parse(address);

    const USER_ADDRESS_CELL = beginCell().storeAddress(USER_ADDRESS).endCell();
    const JETTON_MASTER_ADDRESS_CELL = beginCell()
      .storeAddress(JETTON_MASTER_ADDRESS)
      .endCell();

    const userJettonWalletData = beginCell()
      .storeSlice(USER_ADDRESS_CELL.asSlice())
      .storeUint(0, 8)
      .storeUint(0, 64)
      .storeSlice(JETTON_MASTER_ADDRESS_CELL.asSlice())
      .storeRef(JETTON_WALLET_CODE)
      .endCell();

    const jettonWalletStateInit = beginCell()
      .storeUint(0, 2)
      .storeMaybeRef(JETTON_WALLET_CODE)
      .storeMaybeRef(userJettonWalletData)
      .storeUint(0, 1)
      .endCell();

    return new Address(0, jettonWalletStateInit.hash());
  }
  prepareCreateAttestation(opts: {
    queryId: number;
    trustScore: number;
    expirationDate: number;
    signature: Buffer;
    value: bigint;
    referralId?: bigint;
  }) {
    return {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCode.createAttestation, 32)
        .storeUint(opts.queryId, 64)
        .storeUint(opts.referralId ?? 0, 64)
        .storeUint(opts.trustScore, 8)
        .storeUint(opts.expirationDate, 64)
        .storeBuffer(opts.signature)
        .endCell(),
    };
  }

  async sendCreateAttestation(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId: number;
      trustScore: number;
      expirationDate: number;
      signature: Buffer;
      value: bigint;
      referralId?: bigint;
    }
  ) {
    await provider.internal(via, this.prepareCreateAttestation(opts));
  }

  prepareUpdateAttestation(opts: {
    queryId: number;
    trustScore: number;
    expirationDate: number;
    signature: Buffer;
    value: bigint;
  }) {
    return {
      value: opts.value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(OpCode.updateAttestation, 32)
        .storeUint(opts.queryId, 64)
        .storeUint(opts.trustScore, 8)
        .storeUint(opts.expirationDate, 64)
        .storeBuffer(opts.signature)
        .endCell(),
    };
  }

  async sendUpdateAttestation(
    provider: ContractProvider,
    via: Sender,
    opts: {
      queryId: number;
      trustScore: number;
      expirationDate: number;
      signature: Buffer;
      value: bigint;
    }
  ) {
    await provider.internal(via, this.prepareUpdateAttestation(opts));
  }
}
