"use client";

import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import { api } from "./api";

/*
 * No login yet: the browser remembers which candidate it connected.
 * Replace this with the signed-in user once auth exists.
 */

const KEY = "codetalk.candidateId";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberCandidate(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the candidate just won't persist across reloads.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** undefined while reading storage on the client, null when nothing is connected. */
export function useCandidateId(): string | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}

export function useCandidate() {
  const id = useCandidateId();
  const swr = useSWR(id ? ["candidate", id] : null, () => api.getCandidate(id!), {
    onError: (e) => {
      if (e?.status === 404) rememberCandidate(null); // stale id from an old database
    },
  });
  const forget = useCallback(() => rememberCandidate(null), []);
  return { id, candidate: swr.data, error: swr.error, isLoading: id === undefined || swr.isLoading, mutate: swr.mutate, forget };
}
