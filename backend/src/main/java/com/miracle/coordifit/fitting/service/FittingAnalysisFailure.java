package com.miracle.coordifit.fitting.service;

import com.miracle.coordifit.fitting.dto.FittingAnalysisErrorCode;

public class FittingAnalysisFailure extends RuntimeException {
	private final FittingAnalysisErrorCode errorCode;

	public FittingAnalysisFailure(FittingAnalysisErrorCode errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public FittingAnalysisFailure(FittingAnalysisErrorCode errorCode, String message, Throwable cause) {
		super(message, cause);
		this.errorCode = errorCode;
	}

	public FittingAnalysisErrorCode getErrorCode() {
		return errorCode;
	}
}
