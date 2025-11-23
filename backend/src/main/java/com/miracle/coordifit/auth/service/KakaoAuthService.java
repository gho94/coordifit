package com.miracle.coordifit.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.miracle.coordifit.auth.dto.KakaoUserResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoAuthService implements IKakaoAuthService {
	private final RestClient restClient = RestClient.create();

	@Value("${kakao.client-id}")
	private String kakaoClientId;

	@Value("${kakao.client-secret}")
	private String kakaoClientSecret;

	@Value("${kakao.token-uri}")
	private String kakaoTokenUri;

	@Value("${kakao.user-info-uri}")
	private String kakaoUserInfoUri;

	private record TokenResponse(@JsonProperty("access_token") String accessToken) {
	}

	@Override
	public KakaoUserResponse getKakaoUserInfo(String code, String redirectUri) {
		String accessToken = getKakaoToken(code, redirectUri);
		return getKakaoUserInfo(accessToken);
	}

	private String getKakaoToken(String code, String redirectUri) {
		log.info("카카오 토큰 요청: code={}, redirectUri={}", code, redirectUri);

		MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
		formData.add("grant_type", "authorization_code");
		formData.add("client_id", kakaoClientId);
		formData.add("client_secret", kakaoClientSecret);
		formData.add("redirect_uri", redirectUri);
		formData.add("code", code);

		try {
			TokenResponse response = restClient.post()
				.uri(kakaoTokenUri)
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(formData)
				.retrieve()
				.body(TokenResponse.class);

			log.info("카카오 토큰 요청 성공");
			return response.accessToken();

		} catch (Exception e) {
			log.error("카카오 토큰 요청 실패", e);
			throw new RuntimeException("카카오 토큰 요청에 실패했습니다: " + e.getMessage());
		}
	}

	private KakaoUserResponse getKakaoUserInfo(String accessToken) {
		log.info("카카오 사용자 정보 요청");

		try {
			KakaoUserResponse response = restClient.get()
				.uri(kakaoUserInfoUri)
				.header("Authorization", "Bearer " + accessToken)
				.retrieve()
				.body(KakaoUserResponse.class);

			log.info("카카오 사용자 정보 요청 성공: kakaoId={}", response.getId());

			return response;

		} catch (Exception e) {
			log.error("카카오 사용자 정보 요청 실패", e);
			throw new RuntimeException("카카오 사용자 정보 요청에 실패했습니다: " + e.getMessage());
		}
	}
}
