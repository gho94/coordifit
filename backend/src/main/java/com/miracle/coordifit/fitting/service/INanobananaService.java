package com.miracle.coordifit.fitting.service;

import com.miracle.coordifit.fitting.dto.ImageGenerationRequestDTO;

public interface INanobananaService {
	/**
	 * Gemini 이미지 생성 API 호출 (동기식)
	 * @param requestDTO 이미지 생성 요청 DTO
	 * @return Base64 인코딩된 이미지 데이터
	 */
	String generateImageSync(ImageGenerationRequestDTO requestDTO) throws Exception;
}
