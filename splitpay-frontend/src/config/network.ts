import { defineChain } from "viem"

export const SPLITPAY_ROLLUP = {
  chainId: "splitpay-rollup-1",
  prettyName: "SplitPay Rollup",
  rpc: "http://localhost:26657",
  rest: "http://localhost:1317",
  jsonRpc: "http://localhost:8545",
  jsonRpcWs: "ws://localhost:8546",
  grpc: "http://localhost:9090",
  bech32Prefix: "init",
  slip44: 118,
  gasDenom: "GAS",
  gasAdjustment: 1.5,
  maxGasLimit: 25000000,
  vm: "evm" as const,
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SPLITPAY_CUSTOM_CHAIN: any = {
  chain_id: SPLITPAY_ROLLUP.chainId,
  chain_name: "splitpay-rollup",
  pretty_name: SPLITPAY_ROLLUP.prettyName,
  network_type: "testnet",
  bech32_prefix: SPLITPAY_ROLLUP.bech32Prefix,
  apis: {
    rpc: [{ address: SPLITPAY_ROLLUP.rpc }],
    rest: [{ address: SPLITPAY_ROLLUP.rest }],
    indexer: [{ address: SPLITPAY_ROLLUP.rest }],
    "json-rpc": [{ address: SPLITPAY_ROLLUP.jsonRpc }],
  },
  fees: {
    fee_tokens: [
      {
        denom: SPLITPAY_ROLLUP.gasDenom,
        fixed_min_gas_price: 0,
        low_gas_price: 0,
        average_gas_price: 0,
        high_gas_price: 0,
      },
    ],
  },
  staking: {
    staking_tokens: [{ denom: SPLITPAY_ROLLUP.gasDenom }],
  },
  native_assets: [
    {
      denom: SPLITPAY_ROLLUP.gasDenom,
      name: "Initia Gas",
      symbol: "GAS",
      decimals: 18,
    },
  ],
  metadata: {
    minitia: { type: "minievm" },
    is_l1: false,
  },
}

export const L1_NETWORK = {
  chainId: "initiation-2",
  prettyName: "Initia Testnet",
  rpc: "https://rpc.testnet.initia.xyz:443",
  rest: "https://rest.testnet.initia.xyz",
} as const

export const splitPayEvmChain = defineChain({
  id: 1,
  name: SPLITPAY_ROLLUP.prettyName,
  nativeCurrency: {
    name: "GAS",
    symbol: "GAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [SPLITPAY_ROLLUP.jsonRpc],
      webSocket: [SPLITPAY_ROLLUP.jsonRpcWs],
    },
  },
})
