import { useState, useCallback } from "react";
import { useApi } from "./useApi";
import type {
  SharedLinkEntity,
  CreateShareLinkRequest,
  ShareLinkResponse,
  SharedDocumentAccess,
} from "../models";

export function useSharedLinks() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      documentId: string,
      dto: CreateShareLinkRequest
    ): Promise<ShareLinkResponse> => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post<ShareLinkResponse>(
          `/documents/${documentId}/share`,
          dto
        );
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Error creating share link";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const listByDocument = useCallback(
    async (documentId: string): Promise<SharedLinkEntity[]> => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<SharedLinkEntity[]>(
          `/documents/${documentId}/shares`
        );
        return data;
      } catch (err: any) {
        const message = err?.response?.data?.message || "Error loading shares";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const revoke = useCallback(
    async (linkId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/documents/shares/${linkId}`);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Error revoking share link";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  const getByToken = useCallback(
    async (token: string, password?: string): Promise<SharedDocumentAccess> => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<SharedDocumentAccess>(
          `/shared/${token}`,
          { params: password ? { password } : undefined }
        );
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message || "Error accessing shared document";
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  return {
    loading,
    error,
    create,
    listByDocument,
    revoke,
    getByToken,
  };
}