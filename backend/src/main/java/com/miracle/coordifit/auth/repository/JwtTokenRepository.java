package com.miracle.coordifit.auth.repository;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class JwtTokenRepository {
	private final RedisTemplate<String, String> redisTemplate;

	public void saveToken(String userId, String tokenValue, LocalDateTime expiresAt, String tokenType) {
		String tokenKey = "jwt:token:" + tokenValue;
		String userTokenKey = "jwt:user:" + userId + ":" + tokenType;

		Duration ttl = Duration.between(LocalDateTime.now(), expiresAt);
		if (ttl.isNegative() || ttl.isZero()) {
			ttl = Duration.ofSeconds(1);
		}

		redisTemplate.opsForValue().set(tokenKey, userId, ttl);
		redisTemplate.opsForValue().set(userTokenKey, tokenValue, ttl);
	}

	public void deleteToken(String userId, String tokenType) {
		String userTokenKey = "jwt:user:" + userId + ":" + tokenType;

		String tokenValue = redisTemplate.opsForValue().get(userTokenKey);
		if (tokenValue != null) {
			redisTemplate.delete("jwt:token:" + tokenValue);
			redisTemplate.delete(userTokenKey);
		}
	}
}
