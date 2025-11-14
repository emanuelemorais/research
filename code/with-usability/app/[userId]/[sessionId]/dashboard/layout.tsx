"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { usePrivy } from "@privy-io/react-auth"
import { LoaderCircle } from 'lucide-react';
import { DashboardHeader } from "@/components/DashboardHeader"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user, ready } = usePrivy();
  const router = useRouter();
  const params = useParams();
  const urlUserId = params?.userId as string;
  const urlSessionId = params?.sessionId as string;
  useEffect(() => {
    if (ready && !user) {
      router.push(`/${urlUserId}/${urlSessionId}`);
    }
  }, [ready, user, router, urlUserId, urlSessionId]);

  return (
    ready && user ? (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
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

