/// SplitPay contract ABI and address
/// ABI extracted from splitpay-contract/out/SplitPay.sol/SplitPay.json
/// Address will be populated after deployment to the Initia EVM rollup.

export const SPLITPAY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "owner_", type: "address", internalType: "address" },
      { name: "initialFeeBps_", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  // ── View Functions ──────────────────────────
  {
    type: "function",
    name: "BPS_DENOMINATOR",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_RECIPIENTS",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accumulatedFees",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAccumulatedFees",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "splitCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // ── State-Changing Functions ────────────────
  {
    type: "function",
    name: "splitPayment",
    inputs: [
      { name: "recipients", type: "address[]", internalType: "address[]" },
      { name: "shares", type: "uint256[]", internalType: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setFeeBps",
    inputs: [
      { name: "newFeeBps", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFees",
    inputs: [{ name: "to", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      { name: "newOwner", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ── Events ──────────────────────────────────
  {
    type: "event",
    name: "PaymentSplit",
    inputs: [
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "splitId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "totalAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "feeAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "recipientCount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FeeWithdrawn",
    inputs: [
      { name: "to", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "FeeBpsUpdated",
    inputs: [
      { name: "oldFeeBps", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newFeeBps", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  // ── Custom Errors ───────────────────────────
  { type: "error", name: "ZeroPayment", inputs: [] },
  { type: "error", name: "EmptyRecipients", inputs: [] },
  { type: "error", name: "NoFeesToWithdraw", inputs: [] },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "TooManyRecipients",
    inputs: [{ name: "count", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "ArrayLengthMismatch",
    inputs: [
      { name: "recipientsLength", type: "uint256", internalType: "uint256" },
      { name: "sharesLength", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "SharesSumInvalid",
    inputs: [{ name: "actualSum", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "ZeroAddressRecipient",
    inputs: [{ name: "index", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "ZeroShare",
    inputs: [{ name: "index", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "FeeTooHigh",
    inputs: [{ name: "requestedBps", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
] as const

/// Deployed contract address — update after deployment
export const SPLITPAY_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`

/// Convenience re-export
export const SPLITPAY_CONTRACT = {
  address: SPLITPAY_ADDRESS,
  abi: SPLITPAY_ABI,
} as const
