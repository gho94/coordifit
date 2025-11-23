import { api, TokenManager } from "./axiosInstance";

import { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } from "@/config/config";
import { useUserStore } from "@/stores/userStore";

/**
 * 로그인 요청
 * @param {Object} formData { email, password }
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const requestLogin = async (formData) => {
  try {
    const response = await api.post("/auth/login", {
      email: formData.email,
      password: formData.password,
    });

    if (response.data.success) {
      const { data } = response.data;

      // ✅ JWT 토큰 저장
      TokenManager.setTokens(data.accessToken, data.refreshToken);

      // ✅ 토큰에서 사용자 정보 로드하여 store에 저장
      const { loadUserFromToken } = useUserStore.getState();
      loadUserFromToken?.();

      return { success: true, data };
    } else {
      return { success: false, message: response.data.message || "로그인에 실패했습니다." };
    }
  } catch (error) {
    console.error("❌ 로그인 오류:", error);
    throw error;
  }
};

/* -------------------- 회원가입 / 인증 관련 -------------------- */

/** 이메일 중복 확인 */
export const checkEmailDuplicate = async (email) => {
  try {
    const response = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error("❌ 이메일 중복 확인 오류:", error);
    throw error; // 프론트 단에서 예외 처리 가능하도록
  }
};

/** 닉네임 중복 확인 */
export const checkNicknameDuplicate = async (nickname) => {
  try {
    const response = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
    return response.data;
  } catch (error) {
    console.error("❌ 닉네임 중복 확인 오류:", error);
    throw error;
  }
};

/** 인증 코드 발송 */
export const sendVerificationCode = async (email) => {
  try {
    const response = await api.post("/auth/send-verification", { email });
    return response.data;
  } catch (error) {
    console.error("❌ 인증 코드 발송 오류:", error);
    throw error;
  }
};

/** 회원가입 */
export const signUp = async (formData) => {
  try {
    const response = await api.post("/auth/signup", formData);
    return response.data;
  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    throw error;
  }
};

/* -------------------- 비밀번호 재설정 관련 -------------------- */

/** 비밀번호 재설정 인증 코드 발송 */
export const sendPasswordResetCode = async (email) => {
  try {
    const response = await api.post("/auth/send-password-reset-code", { email });
    return response.data;
  } catch (error) {
    console.error("❌ 비밀번호 재설정 인증 코드 발송 오류:", error);
    throw error;
  }
};

/** 비밀번호 재설정 */
export const resetPassword = async (email, verificationCode, newPassword) => {
  try {
    const response = await api.post("/auth/reset-password", {
      email,
      verificationCode,
      newPassword,
    });
    return response.data;
  } catch (error) {
    console.error("❌ 비밀번호 재설정 오류:", error);
    throw error;
  }
};

/* -------------------- 카카오 로그인 관련 -------------------- */

/**
 * 카카오 로그인 URL 생성
 * @returns {string} 카카오 로그인 URL
 */
export const getKakaoLoginUrl = () => {
  return `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;
};

/**
 * 카카오 로그인 처리
 * @param {string} code - 카카오 인가 코드
 * @param {string} redirectUri - 리다이렉트 URI
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const requestKakaoLogin = async (code, redirectUri) => {
  try {
    const response = await api.post("/auth/kakao/login", {
      code,
      redirectUri,
    });

    if (response.data.success) {
      const { data } = response.data;

      // ✅ JWT 토큰 저장
      TokenManager.setTokens(data.accessToken, data.refreshToken);

      // ✅ 토큰에서 사용자 정보 로드하여 store에 저장
      const { loadUserFromToken } = useUserStore.getState();
      loadUserFromToken?.();

      return { success: true, data };
    } else {
      return { success: false, message: response.data.message || "카카오 로그인에 실패했습니다." };
    }
  } catch (error) {
    console.error("❌ 카카오 로그인 오류:", error);
    throw error;
  }
};
