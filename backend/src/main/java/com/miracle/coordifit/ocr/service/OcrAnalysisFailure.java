package com.miracle.coordifit.ocr.service;

import com.miracle.coordifit.ocr.dto.OcrAnalysisErrorCode;

import lombok.Getter;

@Getter
public class OcrAnalysisFailure extends RuntimeException {

	private final OcrAnalysisErrorCode errorCode;

	public OcrAnalysisFailure(OcrAnalysisErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public OcrAnalysisFailure(OcrAnalysisErrorCode errorCode, String message, Throwable cause) {
		super(message, cause);
		this.errorCode = errorCode;
	}
}
