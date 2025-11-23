package com.miracle.coordifit.auth.service;

import java.time.LocalDateTime;
import java.util.Map;

import com.miracle.coordifit.user.model.User;

public interface IJwtService {

	String getUserIdFromToken(String token);

	LocalDateTime getExpirationFromToken(String token);

	Boolean validateToken(String token);

	/**
	 * 토큰 생성 및 저장
	 * @param user 로그인한 사용자 정보
	 * @return 토큰 정보가 포함된 Map (accessToken, refreshToken, tokenType)
	 */
	Map<String, Object> createTokens(User user);

	/**
	 * 액세스 토큰 갱신
	 * @param user 사용자 정보
	 * @return 새로운 액세스 토큰 정보가 포함된 Map (accessToken, tokenType)
	 */
	Map<String, Object> refreshAccessToken(User user);

	/**
	 * 사용자의 모든 토큰 삭제 (로그아웃)
	 * @param userId 사용자 ID
	 */
	void deleteAllUserTokens(String userId);
}
