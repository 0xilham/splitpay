"use client"

import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Check if it's the specific "Failed to fetch" from InterwovenKit
      if (this.state.error?.message?.includes("Failed to fetch")) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] text-center px-6">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 max-w-md backdrop-blur-xl">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-500/20">
                <span className="text-xl text-rose-500">⚠</span>
              </div>
              <h2 className="mb-2 text-xl font-bold tracking-tight text-white">
                Local nodes are offline
              </h2>
              <p className="text-sm leading-relaxed text-white/50">
                InterwovenKit could not connect to the local L2 rollup. Please
                start your local Initia sequence (minitiad / weave) on ports
                1317 and 26657 to continue.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-full bg-white/10 hover:bg-white/15 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )
      }

      // Generic fallback for other errors
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
          <div className="text-center text-rose-400">
            <h2>Something went wrong.</h2>
            <p className="text-sm opacity-60 text-white/60">
              {this.state.error?.message}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
