package com.miracle.coordifit.common.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miracle.coordifit.common.dto.Base64ImageDto;
import com.miracle.coordifit.common.model.FileInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackgroundRemovalService {

	@Qualifier("fastApiWebClient") private final WebClient fastApiWebClient;
	private final ObjectMapper objectMapper;
	private final IFileService fileService;

	@Value("${app.ai.connect-timeout-ms:3000}")
	private int timeoutMs;

	@Transactional
	public FileInfo removeBackgroundAndUpload(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("파일이 비어있습니다.");
		}

		log.info("배경 제거 요청 시작: fileName={}, size={}", file.getOriginalFilename(), file.getSize());

		try {
			// FastAPI로 배경 제거
			MultiValueMap<String, Object> multipartData = createMultipartBody(file);
			String response = fastApiWebClient.post()
				.uri("/api/background/remove-bg")
				.body(BodyInserters.fromMultipartData(multipartData))
				.retrieve()
				.onStatus(status -> status.isError(),
					clientResponse -> clientResponse.bodyToMono(String.class)
						.defaultIfEmpty("")
						.map(body -> new IllegalArgumentException("FastAPI 배경 제거 실패: " + body)))
				.bodyToMono(String.class)
				.block();

			// 응답 파싱
			JsonNode root = objectMapper.readTree(response);
			JsonNode dataNode = root.path("data");
			if (dataNode.isMissingNode()) {
				throw new IllegalStateException("FastAPI 응답에 data 필드가 없습니다.");
			}

			String resultImage = dataNode.path("resultImage").asText();
			if (resultImage == null || resultImage.isEmpty()) {
				throw new IllegalStateException("FastAPI 응답에 resultImage가 없습니다.");
			}

			Base64ImageDto base64Dto = Base64ImageDto.builder()
				.dataUrl(resultImage)
				.build();

			FileInfo uploadedFile = fileService.uploadBase64(base64Dto);
			log.info("배경 제거 완료: fileName={}, fileId={}", file.getOriginalFilename(), uploadedFile.getFileId());
			return uploadedFile;

		} catch (WebClientResponseException e) {
			log.error("FastAPI 호출 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
			log.warn("배경 제거 실패, 원본 이미지로 저장: fileName={}", file.getOriginalFilename());
			return fileService.uploadFile(file);
		} catch (IllegalArgumentException | IllegalStateException e) {
			log.warn("배경 제거 실패, 원본 이미지로 저장: fileName={}, error={}",
				file.getOriginalFilename(), e.getMessage());
			return fileService.uploadFile(file);
		} catch (Exception e) {
			log.error("배경 제거 처리 중 오류 발생: fileName={}", file.getOriginalFilename(), e);
			log.warn("배경 제거 실패, 원본 이미지로 저장");
			return fileService.uploadFile(file);
		}
	}

	private MultiValueMap<String, Object> createMultipartBody(MultipartFile file) {
		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

		try {
			ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
				@Override
				public String getFilename() {
					return file.getOriginalFilename();
				}
			};
			body.add("file", resource);
		} catch (Exception e) {
			throw new RuntimeException("파일 읽기 실패", e);
		}

		return body;
	}
}
