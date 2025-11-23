package com.miracle.coordifit.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.miracle.coordifit.common.dto.ApiResponseDto;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ApiResponseDto<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
		log.warn("잘못된 요청: {}", e.getMessage());
		return ResponseEntity.badRequest().body(ApiResponseDto.error(e.getMessage()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponseDto<Void>> handleMethodArgumentNotValidException(
		MethodArgumentNotValidException e) {
		String errorMessage = e.getBindingResult().getFieldErrors().isEmpty() ? "요청 값이 올바르지 않습니다."
			: e.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
		log.warn("유효성 검사 실패: {}", errorMessage);
		return ResponseEntity.badRequest().body(ApiResponseDto.error(errorMessage));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponseDto<Void>> handleException(Exception e) {
		log.error("예상치 못한 오류 발생", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(ApiResponseDto.error("서버 내부 오류가 발생했습니다."));
	}
}
