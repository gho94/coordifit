package com.miracle.coordifit.ocr.service;

import com.miracle.coordifit.ocr.dto.OcrAnalysisRequest;
import com.miracle.coordifit.ocr.dto.OcrAnalysisResponse;

public interface IOcrAnalysisService {

	OcrAnalysisResponse analyze(OcrAnalysisRequest request);
}
