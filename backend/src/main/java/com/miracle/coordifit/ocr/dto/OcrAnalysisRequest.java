package com.miracle.coordifit.ocr.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrAnalysisRequest {

	@Schema(description = "FastAPI OCR 결과")
	private OcrResult ocrResult;

	@Schema(description = "분석 힌트", example = "주문내역 이미지")
	private String hint;

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OcrResult {
		private Integer count;
		private List<OcrItem> results;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OcrItem {
		private String text;
		private Double confidence;
	}
}
