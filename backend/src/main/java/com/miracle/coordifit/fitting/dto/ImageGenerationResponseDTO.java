package com.miracle.coordifit.fitting.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google Gemini API의 이미지 응답을 받을 때 사용되는 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationResponseDTO {
	private List<Candidate> candidates;

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Candidate {
		private Content content;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Content {
		private List<Part> parts;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Part {
		private String text;
		private InlineData inlineData;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InlineData {
		private String mimeType;
		private String data;
	}
}
