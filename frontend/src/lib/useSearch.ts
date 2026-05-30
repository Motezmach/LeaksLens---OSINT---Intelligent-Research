"use client";

import { useCallback, useState } from "react";

import { api, apiError } from "@/lib/api";
import type { SearchResponse, SearchType } from "@/types";

interface State {
  loading: boolean;
  data: SearchResponse | null;
  error: string | null;
}

export function useSearch() {
  const [state, setState] = useState<State>({
    loading: false,
    data: null,
    error: null,
  });

  const run = useCallback(
    async (term: string, type: SearchType, wildcard: boolean) => {
      setState({ loading: true, data: null, error: null });
      try {
        const { data } = await api.post<SearchResponse>("/search", {
          term,
          type,
          wildcard,
        });
        setState({ loading: false, data, error: null });
      } catch (err) {
        setState({ loading: false, data: null, error: apiError(err) });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, data: null, error: null });
  }, []);

  return { ...state, run, reset };
}
