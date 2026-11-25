"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api, ApiError } from "./api";

/*
 * The signed-in user and their interview profile, shared by every app page.
 * A 401 means the session is gone, so we go back to sign-in.
 */
export function useMe() {
  const router = useRouter();
  const swr = useSWR("me", api.me, { shouldRetryOnError: false });

  useEffect(() => {
    if (swr.error instanceof ApiError && swr.error.status === 401) {
      router.replace(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [swr.error, router]);

  return {
    me: swr.data,
    user: swr.data?.user,
    candidate: swr.data?.candidate ?? undefined,
    isLoading: swr.isLoading,
    error: swr.error instanceof ApiError && swr.error.status === 401 ? undefined : swr.error,
    mutate: swr.mutate,
  };
}
