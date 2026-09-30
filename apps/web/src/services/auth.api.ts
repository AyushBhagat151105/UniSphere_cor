import { httpClient, setTokens, clearTokens } from "../lib/http-client";
import { z } from "zod";
import type { 
  loginBodySchema, 
  activateAccountBodySchema 
} from "../../../server/src/modules/auth/validators/auth.validators";

type LoginInput = z.infer<typeof loginBodySchema>;
type ActivateInput = z.infer<typeof activateAccountBodySchema>;

export const authApi = {
  login: async (input: LoginInput) => {
    const { data } = await httpClient.post("/api/v1/auth/login", input);
    if (data.success && data.data) {
      setTokens(data.data.accessToken, data.data.refreshToken);
    }
    return data;
  },
  
  activateAccount: async (input: ActivateInput) => {
    const { data } = await httpClient.post("/api/v1/auth/activate-account", input);
    return data;
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await httpClient.post("/api/v1/auth/logout", { refreshToken });
      }
    } finally {
      clearTokens();
    }
  },

  getMe: async () => {
    const { data } = await httpClient.get("/api/v1/auth/me");
    return data;
  }
};
