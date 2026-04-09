"use client"

import { useInterwovenKit } from "@initia/interwovenkit-react"
import { truncateAddress } from "@/lib/resolve-username"

export function ConnectWalletButton() {
  const { address, isConnected, openConnect, openWallet, username } =
    useInterwovenKit()

  if (!isConnected) {
    return (
      <button
        id="connect-wallet-btn"
        type="button"
        onClick={openConnect}
        className="group relative flex cursor-pointer items-center overflow-hidden bg-white px-5 py-2 text-xs font-mono font-bold text-black transition-all duration-200 hover:bg-[#00f0ff]"
      >
        <span>[ CONNECT_WALLET ]</span>
      </button>
    )
  }

  const displayName = username || truncateAddress(address, 4)

  return (
    <button
      id="wallet-info-btn"
      type="button"
      onClick={openWallet}
      className="group flex cursor-pointer items-center gap-2 border border-[#00f0ff]/30 bg-[#00f0ff]/5 px-4 py-2 text-xs font-mono font-medium text-[#00f0ff] transition-all duration-200 hover:bg-[#00f0ff] hover:text-black hover:border-[#00f0ff]"
    >
      <span className="flex size-2 items-center justify-center bg-[#00f0ff] animate-pulse" />
      <span className="max-w-[140px] truncate">{displayName}</span>
    </button>
  )
}
