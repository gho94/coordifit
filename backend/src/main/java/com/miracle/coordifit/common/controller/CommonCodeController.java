package com.miracle.coordifit.common.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.common.dto.CategoryResponseDto;
import com.miracle.coordifit.common.model.CommonCode;
import com.miracle.coordifit.common.service.ICommonCodeService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/common-codes")
@RequiredArgsConstructor
public class CommonCodeController {
	private final ICommonCodeService commonCodeService;

	@GetMapping
	public ResponseEntity<ApiResponseDto<Map<String, CommonCode>>> getCommonCodes() {
		Map<String, CommonCode> commonCodes = commonCodeService.getCommonCodes();
		return ResponseEntity.ok(ApiResponseDto.success("공통 코드 조회 성공", commonCodes));
	}

	@GetMapping("/{parentCodeId}")
	public ResponseEntity<ApiResponseDto<List<CommonCode>>> getCommonCodesByParentCodeId(
		@PathVariable("parentCodeId") String parentCodeId) {
		List<CommonCode> commonCodes = commonCodeService.getCommonCodesByParentCodeId(parentCodeId);
		return ResponseEntity.ok(ApiResponseDto.success("공통 코드 조회 성공", commonCodes));
	}

	@GetMapping("/category")
	public ResponseEntity<ApiResponseDto<CategoryResponseDto>> getCategoryData() {
		CategoryResponseDto categoryData = commonCodeService.getCategoryData();
		return ResponseEntity.ok(ApiResponseDto.success("카테고리 데이터 조회 성공", categoryData));
	}

	@PostMapping
	public ResponseEntity<ApiResponseDto<Void>> createCommonCode(
		@RequestBody CommonCode commonCode,
		Authentication authentication) {
		commonCodeService.createCommonCode(commonCode, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("공통 코드 생성 성공"));
	}

	@PutMapping("/{codeId}")
	public ResponseEntity<ApiResponseDto<Void>> updateCommonCode(
		@PathVariable("codeId") String codeId,
		@RequestBody CommonCode commonCode,
		Authentication authentication) {
		commonCodeService.updateCommonCode(commonCode, codeId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("공통 코드 수정 성공"));
	}

	@DeleteMapping("/{codeId}")
	public ResponseEntity<ApiResponseDto<Void>> deleteCommonCode(@PathVariable("codeId") String codeId) {
		commonCodeService.deleteCommonCode(codeId);
		return ResponseEntity.ok(ApiResponseDto.success("공통 코드 삭제 성공"));
	}
}
