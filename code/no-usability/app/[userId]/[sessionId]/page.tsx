"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useAppContext } from "@/contexts/AppContext"
import HomePage from "../../page"

export default function IdPage() {
  const params = useParams()
  const { setUserId, setSessionId } = useAppContext()
  const userId = params.userId as string
  const sessionId = params.sessionId as string

  useEffect(() => {
    if (userId && sessionId) {
      setUserId(userId)
      setSessionId(sessionId)
    }
  }, [userId, sessionId, setUserId, setSessionId])

  return <HomePage />
}

