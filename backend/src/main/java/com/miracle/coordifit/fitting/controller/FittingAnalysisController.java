package com.miracle.coordifit.fitting.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.fitting.dto.FittingAnalysisErrorCode;
import com.miracle.coordifit.fitting.dto.FittingAnalysisRequest;
import com.miracle.coordifit.fitting.dto.FittingAnalysisResponse;
import com.miracle.coordifit.fitting.service.FittingAnalysisFailure;
import com.miracle.coordifit.fitting.service.IFittingAnalysisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/fitting")
@RequiredArgsConstructor
public class FittingAnalysisController {

	private final IFittingAnalysisService fittingAnalysisService;

	@PostMapping("/analysis")
	public ResponseEntity<ApiResponseDto<?>> analyze(
		@RequestBody FittingAnalysisRequest request) {
		try {
			FittingAnalysisResponse response = fittingAnalysisService.analyze(request);
			return ResponseEntity.ok(
				ApiResponseDto.success("피팅 분석이 완료되었습니다.", response));
		} catch (FittingAnalysisFailure e) {
			FittingAnalysisErrorCode errorCode = e.getErrorCode();
			log.warn("피팅 분석 실패 - code: {}, detail: {}", errorCode.getCode(), e.getMessage());
			return ResponseEntity.status(errorCode.getStatus())
				.body(ApiResponseDto.error(e.getMessage(), Map.of("code", errorCode.getCode())));
		} catch (Exception e) {
			log.error("피팅 분석 처리 중 알 수 없는 오류", e);
			FittingAnalysisErrorCode errorCode = FittingAnalysisErrorCode.INTERNAL_ERROR;
			return ResponseEntity.status(errorCode.getStatus())
				.body(ApiResponseDto.error("피팅 분석 처리 중 오류가 발생했습니다.",
					Map.of("code", errorCode.getCode())));
		}
	}
}
