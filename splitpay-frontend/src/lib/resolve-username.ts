import { isAddress, getAddress } from "viem"
import { fromBech32, toHex } from "@cosmjs/encoding"
import { L1_NETWORK } from "@/config/network"

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

export type ResolvedAddress = {
  /** The resolved EVM hex address (checksummed) */
  address: `0x${string}`
  /** The original input string */
  input: string
  /** How the address was resolved */
  method: "hex" | "bech32" | "username"
  /** Resolved .init username (if applicable) */
  username?: string
}

export type ResolutionError = {
  input: string
  message: string
}

// ──────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────

const INITIA_REST_BASE = L1_NETWORK.rest
const USERNAME_ENDPOINT = `${INITIA_REST_BASE}/initia/usernames/v1`

// ──────────────────────────────────────────────
//  Core Resolver
// ──────────────────────────────────────────────

/**
 * Resolve a recipient input string into an EVM `0x` address.
 *
 * Supports three input formats:
 * 1. `0x...` — EVM hex address (validated and checksummed)
 * 2. `init1...` — Bech32 Initia address (converted to hex via REST)
 * 3. `@username.init` or `username.init` — .init username (resolved via REST)
 *
 * @throws Error if resolution fails
 */
export async function resolveRecipient(
  input: string,
): Promise<ResolvedAddress> {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    throw new Error("Empty input")
  }

  // ── Case 1: EVM hex address ─────────────────
  if (trimmed.startsWith("0x")) {
    return resolveHexAddress(trimmed)
  }

  // ── Case 2: Bech32 init address ─────────────
  if (trimmed.startsWith("init1")) {
    return resolveBech32Address(trimmed)
  }

  // ── Case 3: .init username ──────────────────
  if (trimmed.endsWith(".init") || trimmed.startsWith("@")) {
    return resolveInitUsername(trimmed)
  }

  throw new Error(
    `Unrecognized format: "${trimmed}". Use 0x address, init1 bech32, or @user.init`,
  )
}

/**
 * Batch-resolve multiple recipient inputs.
 * Returns results and errors separately so the UI can display partial success.
 */
export async function resolveRecipients(
  inputs: string[],
): Promise<{
  resolved: ResolvedAddress[]
  errors: ResolutionError[]
}> {
  const results = await Promise.allSettled(inputs.map(resolveRecipient))

  const resolved: ResolvedAddress[] = []
  const errors: ResolutionError[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === "fulfilled") {
      resolved.push(result.value)
    } else {
      errors.push({
        input: inputs[i],
        message:
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error",
      })
    }
  }

  return { resolved, errors }
}

// ──────────────────────────────────────────────
//  Internal Resolvers
// ──────────────────────────────────────────────

function resolveHexAddress(input: string): ResolvedAddress {
  if (!isAddress(input)) {
    throw new Error(`Invalid EVM address: "${input}"`)
  }

  return {
    address: getAddress(input),
    input,
    method: "hex",
  }
}

async function resolveBech32Address(
  bech32: string,
): Promise<ResolvedAddress> {
  try {
    // Decode bech32 directly to get the 20-byte payload
    const decoded = fromBech32(bech32)
    const hex = `0x${toHex(decoded.data)}`

    return {
      address: getAddress(hex),
      input: bech32,
      method: "bech32",
    }
  } catch (err) {
    throw new Error(`Failed to resolve bech32 address: "${bech32}"`)
  }
}

async function resolveInitUsername(
  input: string,
): Promise<ResolvedAddress> {
  // Strip @ prefix and .init suffix to get the raw username
  let username = input
  if (username.startsWith("@")) {
    username = username.slice(1)
  }
  if (username.endsWith(".init")) {
    username = username.slice(0, -5)
  }

  if (username.length === 0) {
    throw new Error("Empty username")
  }

  // Step 1: Resolve username → bech32 address via REST
  const usernameResponse = await fetch(
    `${USERNAME_ENDPOINT}/address/${username}`,
  )

  if (!usernameResponse.ok) {
    if (usernameResponse.status === 404) {
      throw new Error(`Username "@${username}.init" not found`)
    }
    throw new Error(
      `Failed to resolve username "@${username}.init" (${usernameResponse.status})`,
    )
  }

  const usernameData = await usernameResponse.json()
  const bech32Address = usernameData.address as string

  if (!bech32Address) {
    throw new Error(`No address found for "@${username}.init"`)
  }

  // Step 2: Convert bech32 → hex EVM address via CosmJS synchronously
  try {
    const decoded = fromBech32(bech32Address)
    const evmAddress = `0x${toHex(decoded.data)}`

    return {
      address: getAddress(evmAddress),
      input,
      method: "username",
      username: `${username}.init`,
    }
  } catch (err) {
    throw new Error(
      `Failed to convert bech32 to EVM for "@${username}.init"`,
    )
  }
}

// ──────────────────────────────────────────────
//  Utilities
// ──────────────────────────────────────────────

/** Detect the input format for UI hints */
export function detectInputFormat(
  input: string,
): "hex" | "bech32" | "username" | "unknown" {
  const trimmed = input.trim()
  if (trimmed.startsWith("0x")) return "hex"
  if (trimmed.startsWith("init1")) return "bech32"
  if (trimmed.endsWith(".init") || trimmed.startsWith("@")) return "username"
  return "unknown"
}

/** Format a resolved address for display (truncated) */
export function truncateAddress(address?: string, chars = 6): string {
  if (!address) return ""
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}
