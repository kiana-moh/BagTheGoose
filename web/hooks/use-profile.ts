"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { UserProfile } from "@/lib/types";

export const profileQueryKey = ["profile"];

export function useProfile() {
  return useQuery<UserProfile | null>({
    queryKey: profileQueryKey,
    queryFn: apiClient.profile.getProfile
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.profile.updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
    }
  });
}
