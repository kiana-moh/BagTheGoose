"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/types";

export const currentUserQueryKey = ["current-user"];

export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: currentUserQueryKey,
    queryFn: apiClient.auth.getCurrentUser,
    retry: false
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut({
        redirect: false
      });
    },
    onSuccess: async () => {
      queryClient.setQueryData(currentUserQueryKey, null);
      await queryClient.invalidateQueries();
    }
  });
}
