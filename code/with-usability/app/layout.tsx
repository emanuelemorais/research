import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/ProviderPrivy";
import { Toaster } from "@/components/ui/sonner"
import ClarityInit from "@/components/Clarity"
import FloatingInstructionsButton from "@/components/FloatingInstructions";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeFi Platform",
  other: {
    "google": "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        translate="no"
        suppressHydrationWarning
      >
        <ClarityInit />
        <Toaster richColors position="top-right" />
        <Providers> 
          {children} 
        </Providers>
        <FloatingInstructionsButton />
      </body>
    </html>
  );
}
