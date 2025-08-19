import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import type { SheetEntity, CreateSheetRequest, UpdateSheetRequest } from '../models';

export function useSheets() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listByDocument = useCallback(async (documentId: string): Promise<SheetEntity[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<SheetEntity[]>(`/documents/${documentId}/sheets`);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error loading sheets';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const create = useCallback(async (
    documentId: string, 
    dto: CreateSheetRequest
  ): Promise<SheetEntity> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<SheetEntity>(`/documents/${documentId}/sheets`, dto);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error creating sheet';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const update = useCallback(async (
    sheetId: string, 
    dto: UpdateSheetRequest
  ): Promise<SheetEntity> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch<SheetEntity>(`/documents/sheets/${sheetId}`, dto);
      return data;
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error updating sheet';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const remove = useCallback(async (sheetId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/documents/sheets/${sheetId}`);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error deleting sheet';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const reorder = useCallback(async (
    documentId: string, 
    sheetIds: string[]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/documents/${documentId}/sheets/reorder`, { sheetIds });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Error reordering sheets';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    loading,
    error,
    listByDocument,
    create,
    update,
    remove,
    reorder,
  };
}