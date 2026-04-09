"use client"

import { Header } from "@/components/ui/header"
import { useInterwovenKit } from "@initia/interwovenkit-react"
import { ArrowRight, TerminalSquare, ShieldAlert, Cpu } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { isConnected, openConnect } = useInterwovenKit()

  return (
    <>
      <div className="fixed inset-0 bg-cyber-grid z-[-1]" />
      <div className="noise-overlay" />
      
      <Header />
      
      <main className="flex flex-1 flex-col">
        {/* Editorial Splitted Hero */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-24 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            
            {/* Left Huge Typography */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-8">
                <span className="flex size-2 bg-[#00f0ff] animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-[#00f0ff] uppercase">
                  Initia Network Mainnet
                </span>
                <span className="h-px bg-[#00f0ff]/30 flex-1 ml-4 hidden sm:block" />
              </div>
              
              <h1 className="font-syne text-6xl sm:text-7xl lg:text-8xl font-black uppercase text-white leading-[0.9] tracking-tighter hover-glitch">
                Split<br/>
                <span className="text-zinc-600">Payments.</span>
              </h1>
              
              <p className="mt-12 max-w-2xl text-base sm:text-lg text-zinc-400 font-mono leading-relaxed border-l hairline-border pl-6">
                Institutional-grade protocol to execute mass distributions of native assets in a single EVM transaction. Absolute precision. Zero rounding dust. Full <span className="text-[#00f0ff]">@username.init</span> resolution.
              </p>
              
              <div className="mt-12 flex items-center gap-6">
                {isConnected ? (
                  <Link
                    href="/split"
                    className="group relative inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-mono font-bold text-black transition-all hover:bg-[#00f0ff]"
                  >
                    [ INITIATE_SPLIT ]
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={openConnect}
                    className="group relative inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-mono font-bold text-black transition-all hover:bg-[#00f0ff]"
                  >
                    [ CONNECT_KEYSTORE ]
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Terminal Metric */}
            <div className="lg:col-span-4 flex flex-col justify-end mt-16 lg:mt-0">
              <div className="terminal-panel p-6 space-y-6">
                <div className="flex justify-between items-center border-b hairline-border pb-4">
                  <span className="font-mono text-xs text-zinc-500">SYSTEM_STATUS</span>
                  <span className="font-mono text-xs text-[#00f0ff] flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div>
                   <p className="font-mono text-[10px] text-zinc-500 mb-1">PROTOCOL_FEE_BPS</p>
                   <p className="font-syne text-4xl text-white">2.00%</p>
                </div>
                <div>
                   <p className="font-mono text-[10px] text-zinc-500 mb-1">MAX_RECIPIENTS_PER_TX</p>
                   <p className="font-syne text-4xl text-white">20</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="border-t hairline-border">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <FeatureCard
              icon={<TerminalSquare className="size-5" />}
              title="GAS OPTIMIZED"
              description="A single MsgCall distributes native assets to up to 20 recipients. Dust-free precision mapping."
            />
            <FeatureCard
              icon={<Cpu className="size-5" />}
              title="INIT RESOLUTION"
              description="Natively resolves @username.init via InterwovenKit before EVM execution. No hex needed."
            />
            <FeatureCard
              icon={<ShieldAlert className="size-5" />}
              title="ZERO TRUST"
              description="Immutable smart contract. No upgradable proxies. Ownable reentrancy guards."
            />
          </div>
        </section>
      </main>
    </>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group flex flex-col p-10 transition-colors hover:bg-white/[0.02]">
      <div className="text-zinc-600 mb-8 transition-colors group-hover:text-[#00f0ff]">
        {icon}
      </div>
      <h3 className="font-mono text-sm tracking-widest text-white mb-4">
        {title}
      </h3>
      <p className="font-mono text-xs leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  )
}
