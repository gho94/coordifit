package com.miracle.coordifit.auth.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.miracle.coordifit.auth.repository.JwtTokenRepository;
import com.miracle.coordifit.common.repository.FileRepository;
import com.miracle.coordifit.user.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtService implements IJwtService {

	@Value("${jwt.secret}")
	private String secret;

	@Value("${jwt.access-token-expiration:3600000}")
	private long accessTokenExpiration;

	@Value("${jwt.refresh-token-expiration:604800000}")
	private long refreshTokenExpiration;

	@Value("${jwt.issuer:coordifit}")
	private String issuer;

	private final JwtTokenRepository jwtTokenRepository;
	private final FileRepository fileRepository;
	private SecretKey secretKey;

	private SecretKey getSecretKey() {
		if (secretKey == null) {
			secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		}
		return secretKey;
	}

	private String generateToken(User user, String tokenType) {
		Map<String, Object> claims = new HashMap<>();
		claims.put("userId", user.getUserId());
		claims.put("email", user.getEmail());
		claims.put("nickname", user.getNickname());
		claims.put("genderCode", user.getGenderCode());
		claims.put("birthDate", user.getBirthDate() != null ? user.getBirthDate().toString() : null);
		claims.put("type", tokenType);

		if (user.getFileId() != null) {
			String profileImageUrl = fileRepository.selectFileInfoById(user.getFileId().intValue()).getS3Url();
			claims.put("profileImageUrl", profileImageUrl);
		}

		Date now = new Date();
		Date expiryDate = new Date(
			now.getTime() + (tokenType == "ACCESS" ? accessTokenExpiration : refreshTokenExpiration));

		JwtBuilder builder = Jwts.builder()
			.subject(user.getUserId())
			.issuer(issuer)
			.issuedAt(now)
			.expiration(expiryDate)
			.signWith(getSecretKey());

		for (Map.Entry<String, Object> entry : claims.entrySet()) {
			builder.claim(entry.getKey(), entry.getValue());
		}

		return builder.compact();
	}

	@Override
	public String getUserIdFromToken(String token) {
		Claims claims = getAllClaimsFromToken(token);
		return claims.getSubject();
	}

	@Override
	public LocalDateTime getExpirationFromToken(String token) {
		Claims claims = getAllClaimsFromToken(token);
		Date expiration = claims.getExpiration();
		return expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
	}

	@Override
	public Boolean validateToken(String token) {
		try {
			getAllClaimsFromToken(token);
			return true;
		} catch (Exception e) {
			log.debug("JWT 토큰 검증 실패: {}", e.getMessage());
			return false;
		}
	}

	@Override
	public Map<String, Object> createTokens(User user) {
		log.info("사용자 로그인 토큰 생성: {}", user.getUserId());

		// JWT 토큰 생성
		String accessToken = generateToken(user, "ACCESS");
		String refreshToken = generateToken(user, "REFRESH");

		// 기존 토큰 삭제 (보안을 위해)
		jwtTokenRepository.deleteToken(user.getUserId(), "access");
		jwtTokenRepository.deleteToken(user.getUserId(), "refresh");

		// 새 토큰들을 Redis에 저장
		jwtTokenRepository.saveToken(user.getUserId(), accessToken, getExpirationFromToken(accessToken), "access");
		jwtTokenRepository.saveToken(user.getUserId(), refreshToken, getExpirationFromToken(refreshToken), "refresh");

		// 응답 데이터 준비
		Map<String, Object> responseData = new HashMap<>();
		responseData.put("accessToken", accessToken);
		responseData.put("refreshToken", refreshToken);
		responseData.put("tokenType", "Bearer");

		return responseData;
	}

	@Override
	public Map<String, Object> refreshAccessToken(User user) {
		log.info("액세스 토큰 갱신: {}", user.getUserId());

		// 새 액세스 토큰 생성
		String newAccessToken = generateToken(user, "ACCESS");

		// 기존 액세스 토큰 삭제
		jwtTokenRepository.deleteToken(user.getUserId(), "access");

		// 새 액세스 토큰 저장
		jwtTokenRepository.saveToken(user.getUserId(), newAccessToken, getExpirationFromToken(newAccessToken),
			"access");

		// 응답 데이터 준비
		Map<String, Object> responseData = new HashMap<>();
		responseData.put("accessToken", newAccessToken);
		responseData.put("tokenType", "Bearer");

		return responseData;
	}

	@Override
	public void deleteAllUserTokens(String userId) {
		log.info("사용자 모든 토큰 삭제: {}", userId);

		// 해당 사용자의 모든 토큰 삭제
		jwtTokenRepository.deleteToken(userId, "access");
		jwtTokenRepository.deleteToken(userId, "refresh");
	}

	private Claims getAllClaimsFromToken(String token) {
		try {
			return Jwts.parser()
				.verifyWith(secretKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
		} catch (ExpiredJwtException e) {
			log.warn("JWT 토큰이 만료되었습니다: {}", e.getMessage());
			throw e;
		} catch (UnsupportedJwtException e) {
			log.warn("지원하지 않는 JWT 토큰입니다: {}", e.getMessage());
			throw e;
		} catch (MalformedJwtException e) {
			log.warn("잘못된 JWT 토큰입니다: {}", e.getMessage());
			throw e;
		} catch (SecurityException e) {
			log.warn("JWT 토큰 서명이 유효하지 않습니다: {}", e.getMessage());
			throw e;
		} catch (IllegalArgumentException e) {
			log.warn("JWT 토큰이 비어있습니다: {}", e.getMessage());
			throw e;
		}
	}
}
