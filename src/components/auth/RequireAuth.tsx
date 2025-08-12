import { useEffect } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import type { ReactNode } from "react"

interface RequireAuthProps {
  children: ReactNode
  redirectTo?: string
}

export default function RequireAuth({ children, redirectTo }: RequireAuthProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: redirectTo ?? window.location.pathname },
      })
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, redirectTo])

  if (isLoading) return <main style={{ padding: 24 }}>Cargando...</main>
  if (!isAuthenticated) return null

  return <>{children}</>
}