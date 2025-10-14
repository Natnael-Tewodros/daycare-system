"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth" // your auth hook

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login") // redirect if not logged in
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <p>Loading...</p> // optional loading state
  }

  return <>{children}</>
}
