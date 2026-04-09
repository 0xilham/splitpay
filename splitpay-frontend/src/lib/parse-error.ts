/**
 * Parse Web3 transaction errors into user-friendly messages.
 * Handles InterwovenKit, wagmi, and Solidity custom error patterns.
 */
export function parseWeb3Error(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  // User-initiated cancellation
  if (msg.includes("user rejected") || msg.includes("User denied")) {
    return "Transaction cancelled by user"
  }

  // Insufficient funds
  if (msg.includes("insufficient funds") || msg.includes("Insufficient")) {
    return "Insufficient balance for this transaction"
  }

  // SplitPay custom errors
  if (msg.includes("ZeroPayment")) return "Payment amount must be greater than zero"
  if (msg.includes("EmptyRecipients")) return "At least one recipient is required"
  if (msg.includes("TooManyRecipients")) return "Maximum 20 recipients allowed"
  if (msg.includes("ArrayLengthMismatch")) return "Recipients and shares arrays must match"
  if (msg.includes("SharesSumInvalid")) return "Shares must total exactly 100%"
  if (msg.includes("ZeroAddressRecipient")) return "Recipient address cannot be zero"
  if (msg.includes("ZeroShare")) return "Each recipient must have a non-zero share"
  if (msg.includes("FeeTooHigh")) return "Platform fee exceeds maximum (10%)"
  if (msg.includes("NoFeesToWithdraw")) return "No accumulated fees to withdraw"
  if (msg.includes("TransferFailed")) return "Token transfer failed — recipient may reject payments"

  // Solidity execution revert
  if (msg.includes("execution reverted")) {
    const reason = msg.match(/reason="([^"]+)"/)?.[1]
    return reason ?? "Transaction would fail on-chain"
  }

  // Gas estimation failures
  if (msg.includes("gas") && msg.includes("exceed")) {
    return "Transaction exceeds gas limits"
  }

  // Network errors
  if (msg.includes("network") || msg.includes("ECONNREFUSED")) {
    return "Network error — please check your connection"
  }

  return "Transaction failed — please try again"
}
