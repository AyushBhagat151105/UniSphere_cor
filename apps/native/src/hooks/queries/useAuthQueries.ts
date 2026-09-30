import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../services/auth.api";
import { useAuthStore } from "../../stores/auth.store";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data?.data?.user) {
        useAuthStore.getState().login(data.data.user);
      }
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
      useAuthStore.getState().logout();
      queryClient.clear();
    }
  });
}

export function useUser() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, 
  });
}
