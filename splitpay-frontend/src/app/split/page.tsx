"use client"

import { useState } from "react"
import { useInterwovenKit } from "@initia/interwovenkit-react"
import { parseEther } from "viem"
import { encodeFunctionData } from "viem"
import { TerminalSquare, X } from "lucide-react"

import { Header } from "@/components/ui/header"
import { SPLITPAY_CONTRACT } from "@/config/contracts"
import { SPLITPAY_ROLLUP } from "@/config/network"
import { resolveRecipients } from "@/lib/resolve-username"
import { parseWeb3Error } from "@/lib/parse-error"

export default function SplitPage() {
  const { initiaAddress, requestTxBlock, isConnected, openConnect } =
    useInterwovenKit()

  const [amount, setAmount] = useState("")
  const [recipients, setRecipients] = useState([
    { input: "", share: 50 },
    { input: "", share: 50 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successHash, setSuccessHash] = useState("")

  const totalShares = recipients.reduce((sum, r) => sum + Number(r.share), 0)

  const handleAddRecipient = () => {
    if (recipients.length >= 20) return // Contract limit
    const newShare = Math.floor(100 / (recipients.length + 1))
    setRecipients([
      ...recipients.map((r) => ({ ...r, share: newShare })),
      { input: "", share: 100 - newShare * recipients.length },
    ])
  }

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length <= 2) return
    const newRecipients = recipients.filter((_, i) => i !== index)
    const newShare = Math.floor(100 / newRecipients.length)
    setRecipients(
      newRecipients.map((r, i) => ({
        ...r,
        share:
          i === newRecipients.length - 1
            ? 100 - newShare * (newRecipients.length - 1)
            : newShare,
      })),
    )
  }

  const handleUpdateRecipient = (
    index: number,
    field: "input" | "share",
    value: string,
  ) => {
    const parsedValue = field === "share" ? Number(value) : value
    setRecipients(
      recipients.map((r, i) =>
        i === index ? { ...r, [field]: parsedValue } : r,
      ),
    )
  }

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessHash("")
    setLoading(true)

    try {
      if (!isConnected || !initiaAddress) {
        throw new Error("ERR_NO_WALLET: Connect Keystore to proceed.")
      }

      const numAmount = Number(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("ERR_INVALID_AMT: Amount must be greater than zero.")
      }

      if (totalShares !== 100) {
        throw new Error("ERR_MISMATCH: Allocation must strictly equal 100%.")
      }

      // 1. Resolve Usernames
      const { resolved, errors } = await resolveRecipients(
        recipients.map((r) => r.input),
      )

      if (errors.length > 0) {
        throw new Error(
          `ERR_RESOLUTION_FAIL: ${errors.map((e) => e.input).join(", ")}. ${
            errors[0].message
          }`,
        )
      }

      const resolvedAddresses = resolved.map((r) => r.address)
      const sharesBps = recipients.map((r) => r.share * 100) // Convert % to basis points

      // 2. Encode EVM Call
      const inputData = encodeFunctionData({
        abi: SPLITPAY_CONTRACT.abi,
        functionName: "splitPayment",
        args: [resolvedAddresses, sharesBps],
      })

      const msg = {
        typeUrl: "/minievm.evm.v1.MsgCall",
        value: {
          sender: initiaAddress.toLowerCase(),
          contractAddr: SPLITPAY_CONTRACT.address,
          input: inputData,
          value: parseEther(amount).toString(),
          accessList: [],
          authList: [],
        },
      }

      // 3. Request Transaction via InterwovenKit
      const txHash = await requestTxBlock({
        chainId: SPLITPAY_ROLLUP.chainId,
        messages: [msg],
      })

      setSuccessHash(txHash as string)
      setAmount("")
      setRecipients([
        { input: "", share: 50 },
        { input: "", share: 50 },
      ])
    } catch (err: any) {
      setError(parseWeb3Error(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-cyber-grid z-[-1]" />
      <div className="noise-overlay" />
      <Header />

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 pt-20">
        <div className="w-full max-w-4xl terminal-panel">
          {/* Header */}
          <div className="border-b hairline-border bg-white/[0.02] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TerminalSquare className="size-4 text-[#00f0ff]" />
              <h1 className="font-mono text-sm tracking-widest text-white uppercase">
                Ledger Console : Split_TX
              </h1>
            </div>
            <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-widest">
              SECURE_CONTEXT
            </span>
          </div>

          <form onSubmit={validateAndSubmit} className="p-0">
            {/* Amount Section */}
            <div className="flex flex-col md:flex-row border-b hairline-border">
              <div className="p-6 md:w-5/12 border-b md:border-b-0 md:border-r hairline-border bg-white/[0.01]">
                <label className="block font-mono text-[10px] text-zinc-500 mb-2 uppercase tracking-widest">
                  Total Allocation
                </label>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent font-syne text-5xl text-white outline-none placeholder:text-zinc-700"
                    required
                  />
                  <span className="font-mono text-sm text-[#00f0ff]">GAS</span>
                </div>
              </div>
              <div className="p-6 md:w-7/12 flex items-center bg-white/[0.005]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col justify-center">
                    <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 break-normal">
                      <span className="size-1 bg-zinc-500 inline-block"></span> Contract
                    </span>
                    <span className="font-mono text-xs text-white truncate max-w-full block bg-black/50 border hairline-border px-2 py-1 select-all">{SPLITPAY_CONTRACT.address}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 break-normal">
                      <span className="size-1 bg-[#00f0ff] inline-block animate-pulse"></span> Network
                    </span>
                    <span className="font-mono text-xs text-[#00f0ff] uppercase block bg-black/50 border hairline-border px-2 py-1 text-center truncate">{SPLITPAY_ROLLUP.chainId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Header */}
            <div className="flex items-center px-6 py-3 border-b hairline-border bg-white/[0.02] font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              <div className="flex-1">Recipient Identity (Bech32 / Hex / .init)</div>
              <div className="w-24 text-right">Share %</div>
              <div className="w-12"></div>
            </div>

            {/* Recipients List */}
            <div className="divide-y hairline-border divide-white/[0.05]">
              {recipients.map((recipient, idx) => (
                <div key={idx} className="flex items-center px-6 py-2.5 group hover:bg-white/[0.02] transition-colors">
                  <div className="font-mono text-xs text-zinc-600 mr-4 w-6 text-right">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <input
                    type="text"
                    value={recipient.input}
                    onChange={(e) => handleUpdateRecipient(idx, "input", e.target.value)}
                    placeholder="Address or @username.init"
                    className="flex-1 bg-transparent font-mono text-sm text-[#00f0ff] outline-none placeholder:text-zinc-600 focus:placeholder:text-zinc-700 transition-colors"
                    required
                  />
                  <div className="w-24 flex items-center justify-end pl-4 border-l hairline-border ml-4">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={recipient.share || ""}
                      onChange={(e) => handleUpdateRecipient(idx, "share", e.target.value)}
                      className="w-12 bg-transparent text-right font-mono text-sm text-white outline-none placeholder:text-zinc-700"
                      placeholder="50"
                      required
                    />
                    <span className="font-mono text-xs text-zinc-500 ml-1">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(idx)}
                    disabled={recipients.length <= 2}
                    className="w-12 flex items-center justify-center text-zinc-600 hover:text-red-500 disabled:opacity-20 cursor-pointer transition-colors ml-2"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Form */}
            <div className="flex items-center justify-between px-6 py-5 border-t hairline-border bg-white/[0.01]">
              <button
                type="button"
                onClick={handleAddRecipient}
                disabled={recipients.length >= 20}
                className="group relative inline-flex items-center gap-2 border hairline-border px-4 py-2 font-mono text-xs tracking-widest text-zinc-400 hover:text-white hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all disabled:opacity-30 disabled:hover:border-white/10"
              >
                + APPEND_ROW
              </button>
              
              <div className="flex items-center gap-4">
                <span className={`font-mono text-[10px] uppercase tracking-widest ${totalShares === 100 ? 'text-zinc-500' : 'text-red-500'}`}>
                  Allocated: {totalShares}%
                </span>
                
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={openConnect}
                    className="bg-white px-6 py-2 font-mono text-xs font-bold text-black hover:bg-[#00f0ff] transition-colors"
                  >
                    [ CONNECT_KEYSTORE ]
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || totalShares !== 100}
                    className="bg-[#00f0ff] px-6 py-2 font-mono text-xs font-bold text-black hover:bg-white hover:shadow-[0_0_15px_#00f0ff] transition-all disabled:opacity-50 disabled:hover:bg-[#00f0ff] disabled:hover:shadow-none"
                  >
                    {loading ? "[ PROCESSING_TX... ]" : "[ EXECUTE_SPLIT ]"}
                  </button>
                )}
              </div>
            </div>

            {/* Error / Success Logs */}
            {(error || successHash) && (
              <div className="border-t hairline-border p-6 bg-[var(--color-surface)]">
                {error && (
                  <div className="font-mono text-xs text-red-500">
                    <span className="text-red-700 mr-2">{">"}</span> {error}
                  </div>
                )}
                {successHash && (
                  <div className="font-mono text-xs text-[#00f0ff]">
                    <span className="text-zinc-600 mr-2">{">"}</span> TX_SUCCESS: {successHash}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
