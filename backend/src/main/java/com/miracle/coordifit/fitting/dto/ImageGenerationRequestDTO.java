package com.miracle.coordifit.fitting.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google Gemini API에 이미지를 요청할 때 사용되는 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationRequestDTO {
	private List<Contents> contents;
	private GenerationConfig generationConfig;

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Contents {
		private List<Part> parts;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Part {
		private String text;
		private InlineData inlineData; //
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class GenerationConfig {
		private List<String> responseModalities;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InlineData {
		private String mimeType;
		private String data;
	}
}
