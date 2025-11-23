import axios from "axios";

import { API_URL, FASTAPI_URL } from "../config/config";

const api = axios.create({ baseURL: API_URL });
const fastApi = axios.create({ baseURL: FASTAPI_URL });
const weatherApi = axios.create({
  baseURL: "https://api.open-meteo.com",
  timeout: 8000,
});

const pastWeatherApi = axios.create({
  baseURL: "https://archive-api.open-meteo.com",
  timeout: 5000,
});

weatherApi.defaults.params = {
  timezone: "auto",
};

// 토큰 관리 함수들
const TokenManager = {
  // 토큰 저장
  setTokens(accessToken, refreshToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  // 액세스 토큰 가져오기
  getAccessToken() {
    return localStorage.getItem("accessToken");
  },

  // 리프레시 토큰 가져오기
  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },

  // 토큰 제거
  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  // 로그인 상태 확인
  isLoggedIn() {
    return !!this.getAccessToken();
  },
};

// 요청 인터셉터 - 자동으로 Authorization 헤더 추가
api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 응답 인터셉터 - 토큰 만료 시 자동 갱신
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken) {
          // 리프레시 토큰이 없으면 로그아웃 처리
          TokenManager.clearTokens();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // 토큰 갱신 요청
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken } = response.data.data;

        // 새 토큰 저장
        TokenManager.setTokens(accessToken, refreshToken);

        // 원래 요청에 새 토큰 적용
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        TokenManager.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// 토큰 관리 함수들도 export
export { api, fastApi, weatherApi, pastWeatherApi, TokenManager };
