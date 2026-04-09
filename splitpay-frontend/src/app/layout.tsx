import type { Metadata } from "next"
import { Syne, JetBrains_Mono } from "next/font/google"
import { InterwovenProvider } from "@/components/providers/interwoven-provider"
import "./globals.css"

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SplitPay — Split Payments on Initia",
  description:
    "Revenue-generating payment splitter on Initia. Split native token payments across multiple recipients with .init username resolution.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col font-mono text-zinc-300">
        <InterwovenProvider>{children}</InterwovenProvider>
      </body>
    </html>
  )
}
