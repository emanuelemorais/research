"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { usePrivy } from "@privy-io/react-auth"
import { LoaderCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.push("/");
    }
  }, [ready, user, router]);

  return (
    ready && user ? (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* <DashboardHeader /> */}
          <main className="flex-1 bg-muted/20">{children}</main>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="w-8 h-8 animate-spin" />
        Carregando...
      </div>
    )
  )
}
