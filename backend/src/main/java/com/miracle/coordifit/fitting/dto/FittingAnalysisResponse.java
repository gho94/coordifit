package com.miracle.coordifit.fitting.dto;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FittingAnalysisResponse {

	private final String title;
	private final List<String> contents;
	private final List<String> hashtags;
	private final DebugInfo debug;

	@Getter
	@Builder
	public static class DebugInfo {

		private final String model;
		private final int promptTokens;
		private final int completionTokens;
		private final long latencyMs;
	}
}
