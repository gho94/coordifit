package com.miracle.coordifit.fitting.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.miracle.coordifit.fitting.dto.ImageGenerationRequestDTO;
import com.miracle.coordifit.fitting.dto.ImageGenerationResponseDTO;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NanobananaService implements INanobananaService {

	private final WebClient geminiWebClient;

	@Value("${app.google.gemini.api-key}")
	private String apiKey;

	public NanobananaService(@Qualifier("geminiWebClient") WebClient geminiWebClient) {
		this.geminiWebClient = geminiWebClient;
	}

	/**
	 * Gemini 이미지 생성 API 호출 (동기식)
	 */
	@Override
	public String generateImageSync(ImageGenerationRequestDTO requestDTO) throws Exception {
		try {
			ImageGenerationResponseDTO response = geminiWebClient.post()
				.uri(uriBuilder -> uriBuilder
					.path("/v1beta/models/gemini-2.5-flash-image-preview:generateContent")
					.queryParam("key", apiKey)
					.build())
				.bodyValue(requestDTO)
				.retrieve()
				.bodyToMono(ImageGenerationResponseDTO.class)
				.block(); // ✅ block() → 동기식으로 대기

			if (response == null || response.getCandidates() == null || response.getCandidates().isEmpty()) {
				throw new RuntimeException("No candidates returned from Gemini API.");
			}

			var candidate = response.getCandidates().get(0);
			var content = candidate.getContent();
			if (content == null || content.getParts() == null || content.getParts().isEmpty()) {
				throw new RuntimeException("Gemini response content parts are empty.");
			}

			var part = content.getParts().get(0);
			if (part.getInlineData() != null && part.getInlineData().getData() != null) {
				return part.getInlineData().getData(); // ✅ Base64 데이터 리턴
			} else if (part.getText() != null) {
				return "[TEXT RESPONSE] " + part.getText();
			} else {
				throw new RuntimeException("Gemini response has no usable content.");
			}

		} catch (WebClientResponseException e) {
			log.error("❌ Gemini API HTTP error: {}", e.getResponseBodyAsString());
			throw new RuntimeException("Gemini API call failed: " + e.getMessage(), e);
		} catch (Exception e) {
			log.error("❌ Gemini sync request failed: {}", e.getMessage());
			throw e;
		}
	}
}
