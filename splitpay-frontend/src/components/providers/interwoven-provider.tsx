"use client"

import type { PropsWithChildren } from "react"
import { useState, useEffect } from "react"
import { createConfig, http, WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  initiaPrivyWalletConnector,
  injectStyles,
  InterwovenKitProvider,
  TESTNET,
} from "@initia/interwovenkit-react"
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js"
import {
  splitPayEvmChain,
  SPLITPAY_ROLLUP,
  SPLITPAY_CUSTOM_CHAIN,
} from "@/config/network"
import { AppErrorBoundary } from "./error-boundary"

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [splitPayEvmChain],
  transports: {
    [splitPayEvmChain.id]: http(SPLITPAY_ROLLUP.jsonRpc),
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
    },
  },
})

export function InterwovenProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    injectStyles(interwovenKitStyles)
    setMounted(true)
  }, [])

  // Prevent SSR — InterwovenKit requires browser APIs
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-white/40">Loading SplitPay…</p>
        </div>
      </div>
    )
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={SPLITPAY_ROLLUP.chainId}
            customChain={SPLITPAY_CUSTOM_CHAIN}
            // @ts-expect-error customChains is required by InterwovenKit runtime for local chains
            customChains={[SPLITPAY_CUSTOM_CHAIN]}
            theme="dark"
            disableAnalytics
          >
            {children}
          </InterwovenKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
