"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button"
import { Menu, X } from "lucide-react"

const navLinks = [
  { label: "SPLIT", href: "/split" },
  { label: "HISTORY", href: "/history" },
] as const

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-[var(--color-surface)]/90 backdrop-blur-md border-b hairline-border"
          : "bg-[var(--color-surface)] border-b hairline-border",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 transition-opacity hover:opacity-80 font-syne"
        >
          <span className="text-xl font-bold tracking-tighter text-white">
            SPLIT<span className="text-[#00f0ff] group-hover:text-white transition-colors duration-200">PAY</span>
          </span>
          <span className="font-mono text-xs text-zinc-500 hidden sm:inline-block">v1.0.0</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex border-l hairline-border h-full pl-8 ml-8 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-mono font-medium tracking-widest text-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Wallet */}
        <div className="hidden md:flex items-center h-full border-l hairline-border pl-6">
          <ConnectWalletButton />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex size-10 items-center justify-center text-zinc-400 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col bg-[var(--color-surface)] border-t hairline-border md:hidden terminal-panel"
        >
          <div className="flex flex-1 flex-col gap-1 p-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-4 text-sm font-mono tracking-widest text-zinc-400 transition-colors hover:bg-white/5 hover:text-[#00f0ff] border-b hairline-border"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t hairline-border p-6">
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </header>
  )
}

