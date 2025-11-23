package com.miracle.coordifit.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * API 응답 공통 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ApiResponseDto<T> {

	private boolean success;
	private String message;
	private T data;

	// 성공 응답 생성 메서드
	public static <T> ApiResponseDto<T> success(String message, T data) {
		return new ApiResponseDto<>(true, message, data);
	}

	// 성공 응답 생성 메서드 (데이터 없음)
	public static <T> ApiResponseDto<T> success(String message) {
		return new ApiResponseDto<>(true, message, null);
	}

	// 실패 응답 생성 메서드
	public static <T> ApiResponseDto<T> error(String message) {
		return new ApiResponseDto<>(false, message, null);
	}

	// 실패 응답 생성 메서드 (데이터 포함)
	public static <T> ApiResponseDto<T> error(String message, T data) {
		return new ApiResponseDto<>(false, message, data);
	}
}
