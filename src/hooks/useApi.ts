// hooks/useApi.ts
import { useAuth0 } from "@auth0/auth0-react";
import axios, { type AxiosInstance } from "axios";
import { useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

export function useApi(): AxiosInstance {
  const { getAccessTokenSilently } = useAuth0();

  return useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });
    instance.interceptors.request.use(async (config) => {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: AUDIENCE },
      });

      console.log("ACCESS TOKEN:", token);
      console.log("DECODED:", JSON.parse(atob(token.split(".")[1])));
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      return config;
    });
    return instance;
  }, [getAccessTokenSilently]);
}
