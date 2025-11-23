package com.miracle.coordifit.ocr.dto;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OcrAnalysisResponse {

	private final List<ProductInfo> products;
	private final DebugInfo debug;

	@Getter
	@Builder
	public static class ProductInfo {
		private final String brand;
		private final String name;
		private final String size;
		private final Integer price;
		private final String purchaseDate;
	}

	@Getter
	@Builder
	public static class DebugInfo {
		private final String model;
		private final int promptTokens;
		private final int completionTokens;
		private final long latencyMs;
		private final int ocrResultCount;
	}
}
