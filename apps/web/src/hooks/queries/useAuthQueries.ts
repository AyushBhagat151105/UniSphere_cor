import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../services/auth.api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      // Invalidate the 'me' query so it refetches user profile
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useActivateAccount() {
  return useMutation({
    mutationFn: authApi.activateAccount,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear(); // Clear all queries on logout to dump cached data
    }
  });
}

export function useUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    // Don't retry auth checks unless we want to loop, the interceptor handles 401s
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
