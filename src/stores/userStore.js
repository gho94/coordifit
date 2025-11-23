import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { TokenManager } from "../services/axiosInstance";

const parseJWT = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT 파싱 오류:", error);
    return null;
  }
};

export const useUserStore = create(
  devtools((set) => ({
    user: null,

    setUser: (userData) => set({ user: userData }),

    loadUserFromToken: () => {
      try {
        const token = TokenManager.getAccessToken();
        if (!token) {
          set({ user: null });
          return false;
        }

        const payload = parseJWT(token);
        if (!payload) {
          set({ user: null });
          return false;
        }

        console.log("payload", payload);

        const userData = {
          userId: payload.userId,
          email: payload.email,
          nickname: payload.nickname,
          profileImageUrl: payload.profileImageUrl,
          genderCode: payload.genderCode,
          birthDate: payload.birthDate,
        };

        set({ user: userData });
        return true;
      } catch (error) {
        console.error("토큰에서 사용자 정보 로드 오류:", error);
        set({ user: null });
        return false;
      }
    },

    logout: () => {
      TokenManager.clearTokens();
      set({ user: null });
    },
  })),
);
