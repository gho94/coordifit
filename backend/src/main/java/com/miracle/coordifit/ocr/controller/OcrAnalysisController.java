package com.miracle.coordifit.ocr.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.ocr.dto.OcrAnalysisErrorCode;
import com.miracle.coordifit.ocr.dto.OcrAnalysisRequest;
import com.miracle.coordifit.ocr.dto.OcrAnalysisResponse;
import com.miracle.coordifit.ocr.service.IOcrAnalysisService;
import com.miracle.coordifit.ocr.service.OcrAnalysisFailure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrAnalysisController {

	private final IOcrAnalysisService ocrAnalysisService;

	@PostMapping("/analysis")
	public ResponseEntity<ApiResponseDto<?>> analyze(
		@RequestBody OcrAnalysisRequest request) {

		log.info("🔍 OCR 분석 요청 수신 - results 개수: {}, hint: '{}'",
			request.getOcrResult() != null && request.getOcrResult().getResults() != null
				? request.getOcrResult().getResults().size() : "null",
			request.getHint());

		try {
			OcrAnalysisResponse response = ocrAnalysisService.analyze(request);
			log.info("✅ OCR 분석 완료 - 상품 개수: {}", response.getProducts().size());
			return ResponseEntity.ok(
				ApiResponseDto.success("OCR 분석이 완료되었습니다.", response));
		} catch (OcrAnalysisFailure e) {
			OcrAnalysisErrorCode errorCode = e.getErrorCode();
			log.warn("❌ OCR 분석 실패 - code: {}, detail: {}", errorCode.getCode(), e.getMessage());
			return ResponseEntity.status(errorCode.getStatus())
				.body(ApiResponseDto.error(e.getMessage(), Map.of("code", errorCode.getCode())));
		} catch (Exception e) {
			log.error("💥 OCR 분석 처리 중 알 수 없는 오류", e);
			OcrAnalysisErrorCode errorCode = OcrAnalysisErrorCode.INTERNAL_ERROR;
			return ResponseEntity.status(errorCode.getStatus())
				.body(ApiResponseDto.error("OCR 분석 처리 중 오류가 발생했습니다.",
					Map.of("code", errorCode.getCode())));
		}
	}
}
