// hooks/useApi.ts
import { useAuth0 } from "@auth0/auth0-react";
import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string;

type ApiOptions = {
  isShared?: boolean;
  sharedToken?: string;
};

export function useApi(opts: ApiOptions = {}): AxiosInstance {
  const { isShared = false, sharedToken } = opts;
  const { getAccessTokenSilently } = useAuth0();

  return useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE,
      withCredentials: !isShared, // en compartido no mandamos cookies
      timeout: 20000,
    });

    // --- Request ---
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const headers = AxiosHeaders.from(config.headers);

        if (isShared && sharedToken) {
          headers.delete("Authorization");
          headers.set("x-shared-token", sharedToken);
          // si tu backend NO requiere el query param, quita esta línea:
          // config.params = { ...(config.params ?? {}), sharedToken };
          config.headers = headers;
          return config;
        }

        // Modo normal
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: { audience: AUDIENCE },
          });
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch {
          // rutas públicas: seguimos sin header
        }

        config.headers = headers;
        return config;
      }
    );

    // --- Response (solo para depurar 401/403) ---
    instance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          console.warn(
            `[API ${isShared ? "shared" : "normal"}]`,
            err.response.status,
            err.config?.url
          );
        }
        return Promise.reject(err);
      }
    );

    return instance;
    // deps: solo cambias instancia si cambia el modo o el token compartido
  }, [isShared, sharedToken, getAccessTokenSilently]);
}
