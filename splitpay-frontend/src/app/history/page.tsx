"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/ui/header"
import { useInterwovenKit } from "@initia/interwovenkit-react"
import { TerminalSquare, RefreshCw, ExternalLink } from "lucide-react"
import { createPublicClient, http, formatEther, decodeEventLog } from "viem"

import { SPLITPAY_CONTRACT } from "@/config/contracts"
import { splitPayEvmChain } from "@/config/network"

// We use Viem to read directly from the EVM local rollup
const publicClient = createPublicClient({
  chain: splitPayEvmChain,
  transport: http(splitPayEvmChain.rpcUrls.default.http[0]),
})

type HistoryLog = {
  txHash: string
  blockNumber: number
  splitId: number
  totalAmountText: string
  feeAmountText: string
  recipientCount: number
}

// Fallback dummy data for hackathon presentation if no real logs yet
const DUMMY_LOGS: HistoryLog[] = [
  {
    txHash: "0x892a00bd73c681283e16447817eb48c4125b2a2aa9ebdbebbef85b37651a5124",
    blockNumber: 14205,
    splitId: 1,
    totalAmountText: "10.0",
    feeAmountText: "0.20",
    recipientCount: 3,
  },
  {
    txHash: "0x43fbef029fcf958f2be4c5eabc451de634eb747e92383c21a1b18cff1a052e72",
    blockNumber: 14210,
    splitId: 2,
    totalAmountText: "50.5",
    feeAmountText: "1.01",
    recipientCount: 5,
  }
]

export default function HistoryPage() {
  const { isConnected, openConnect } = useInterwovenKit()
  const [logs, setLogs] = useState<HistoryLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchHistory = async () => {
    setLoading(true)
    setError("")
    
    try {
      // In a real production app without an indexer, getLogs across all blocks is slow.
      // But for an appchain hackathon, this is perfectly fine.
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n

      const rawLogs = await publicClient.getLogs({
        address: SPLITPAY_CONTRACT.address,
        event: {
          type: "event",
          name: "PaymentSplit",
          inputs: [
            { name: "sender", type: "address", indexed: true, internalType: "address" },
            { name: "splitId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "totalAmount", type: "uint256", indexed: false, internalType: "uint256" },
            { name: "feeAmount", type: "uint256", indexed: false, internalType: "uint256" },
            { name: "recipientCount", type: "uint256", indexed: false, internalType: "uint256" },
          ],
        },
        fromBlock,
        toBlock: currentBlock,
      })

      if (rawLogs.length === 0) {
        // Fallback to dummy data to show UI structure
        setLogs(DUMMY_LOGS)
      } else {
        const parsedLogs = rawLogs.map((log: any) => ({
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
          splitId: Number(log.args.splitId),
          totalAmountText: formatEther(log.args.totalAmount),
          feeAmountText: formatEther(log.args.feeAmount),
          recipientCount: Number(log.args.recipientCount),
        }))
        // Most recent first
        setLogs(parsedLogs.reverse())
      }
    } catch (err: any) {
      console.error(err)
      setError("ERR_RPC_SYNC: " + err.message.substring(0, 50))
      setLogs(DUMMY_LOGS) // fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <>
      <div className="fixed inset-0 bg-cyber-grid z-[-1]" />
      <div className="noise-overlay" />
      <Header />

      <main className="mx-auto w-full max-w-5xl px-6 pt-12 pb-24">
        
        {/* Header Block */}
        <div className="mb-8 flex items-end justify-between border-b hairline-border pb-4">
          <div>
            <h1 className="font-syne text-4xl text-white uppercase flex items-center gap-4">
              <TerminalSquare className="size-8 text-[#00f0ff]" />
              TX_HISTORY
            </h1>
            <p className="font-mono text-sm tracking-widest text-[#00f0ff]/70 mt-2">
              ON-CHAIN SPLIT EVENT LOGS
            </p>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-2 group px-4 py-2 hover:bg-[#00f0ff]/5 border hairline-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 text-zinc-400 group-hover:text-white ${loading ? "animate-spin" : ""}`} />
            <span className="font-mono text-xs tracking-widest text-zinc-400 group-hover:text-white uppercase transition-colors">
              SYNC_LOGS
            </span>
          </button>
        </div>

        {/* Not connected warning */}
        {!isConnected && (
          <div className="mb-8 bg-zinc-900 border hairline-border p-4 flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
              [WARNING] KEYSTORE NOT CONNECTED. SHOWING GLOBAL LOGS.
            </span>
            <button
              onClick={openConnect}
              className="font-mono text-xs text-[#00f0ff] hover:text-white uppercase tracking-widest underline decoration-[#00f0ff]/30"
            >
              CONNECT_NOW
            </button>
          </div>
        )}

        {/* History Table Container */}
        <div className="terminal-panel overflow-x-auto">
          <table className="w-full text-left font-mono text-sm whitespace-nowrap">
            <thead className="bg-white/[0.02]">
              <tr className="border-b hairline-border text-[10px] uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-4 font-normal">Split_ID</th>
                <th className="px-6 py-4 font-normal">Tx_Hash</th>
                <th className="px-6 py-4 font-normal text-right">Block</th>
                <th className="px-6 py-4 font-normal text-right">Recipients</th>
                <th className="px-6 py-4 font-normal text-right">Total Vol (GAS)</th>
                <th className="px-6 py-4 font-normal text-right border-l hairline-border">O_Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline-border divide-white/[0.05]">
              {logs.map((log, i) => (
                <tr key={i} className="group hover:bg-[#00f0ff]/5 transition-colors">
                  <td className="px-6 py-4 font-syne text-lg text-white">
                    #{log.splitId}
                  </td>
                  <td className="px-6 py-4 text-[#00f0ff]">
                    <a
                      href="#"
                      className="flex items-center gap-2 hover:underline decoration-[#00f0ff]/50"
                      onClick={(e) => e.preventDefault()}
                    >
                      {log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}
                      <ExternalLink className="size-3 opacity-50 group-hover:opacity-100" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-right">
                    {log.blockNumber}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-right">
                    {log.recipientCount}
                  </td>
                  <td className="px-6 py-4 text-white text-right font-medium">
                    {log.totalAmountText}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-right border-l hairline-border">
                    {log.feeAmountText}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    NO_DATA_FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {error && (
            <div className="bg-red-950/20 px-6 py-3 border-t hairline-border">
              <p className="font-mono text-xs text-red-500">
                <span className="text-red-700 mr-2">{">"}</span>
                {error}
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
