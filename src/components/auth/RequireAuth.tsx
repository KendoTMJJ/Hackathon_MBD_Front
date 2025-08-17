// components/auth/RequireAuth.tsx
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import type { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function RequireAuth({
  children,
  redirectTo,
}: RequireAuthProps) {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    getAccessTokenSilently,
  } = useAuth0();
  const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string;

  useEffect(() => {
    if (isLoading) return;

    (async () => {
      if (isAuthenticated) {
        // Warm-up: asegura que existe un access_token para TU API
        try {
          await getAccessTokenSilently({
            authorizationParams: { audience: AUDIENCE },
          });
        } catch {
          // si falla, no bloqueamos la UI
        }
        return;
      }

      // No autenticado → redirige pidiendo el audience correcto
      await loginWithRedirect({
        appState: { returnTo: redirectTo ?? window.location.pathname },
        authorizationParams: {
          audience: AUDIENCE,
          scope: "openid profile email",
        },
      });
    })();
  }, [
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    getAccessTokenSilently,
    redirectTo,
    AUDIENCE,
  ]);

  if (isLoading) return <main style={{ padding: 24 }}>Cargando...</main>;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
