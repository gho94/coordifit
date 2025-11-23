package com.miracle.coordifit.ocr.dto;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OcrAnalysisErrorCode {

	BAD_REQUEST("OCR_001", HttpStatus.BAD_REQUEST),
	OCR_SERVICE_ERROR("OCR_002", HttpStatus.SERVICE_UNAVAILABLE),
	OPENAI_ERROR("OCR_003", HttpStatus.SERVICE_UNAVAILABLE),
	PARSE_ERROR("OCR_004", HttpStatus.INTERNAL_SERVER_ERROR),
	INTERNAL_ERROR("OCR_005", HttpStatus.INTERNAL_SERVER_ERROR);

	private final String code;
	private final HttpStatus status;
}
