import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import RainbowKitLayout from "@/components/layout/RainbowKitLayout"
import FloatingInstructionsButton from "@/components/floating-instructions-button"
import Clarity from '@microsoft/clarity';

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DeFi Platform",
  description: "Plataforma DeFi descentralizada para gerenciamento de ativos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  Clarity.init('u2hv11k2qz');

  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        <RainbowKitLayout>
          {children}
          <FloatingInstructionsButton />
          <Analytics />
        </RainbowKitLayout>
      </body>
    </html>
  )
}
