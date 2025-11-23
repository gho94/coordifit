package com.miracle.coordifit.fitting.dto;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FittingAnalysisErrorCode {
	BAD_REQUEST("BAD_REQUEST", HttpStatus.BAD_REQUEST),
	OPENAI_ERROR("OPENAI_ERROR", HttpStatus.BAD_GATEWAY),
	PARSE_ERROR("PARSE_ERROR", HttpStatus.UNPROCESSABLE_ENTITY),
	INTERNAL_ERROR("INTERNAL_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);

	private final String code;
	private final HttpStatus status;
}
