package com.miracle.coordifit.clothes.controller;

import java.util.List;

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

import com.miracle.coordifit.clothes.dto.ClothesDetailResponse;
import com.miracle.coordifit.clothes.dto.ClothesRequest;
import com.miracle.coordifit.clothes.dto.ClothesResponse;
import com.miracle.coordifit.clothes.service.IClothesService;
import com.miracle.coordifit.common.dto.ApiResponseDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/clothes")
@RequiredArgsConstructor
public class ClothesController {

	private final IClothesService clothesService;

	@PostMapping
	public ResponseEntity<ApiResponseDto<Void>> createClothes(
		@Valid ClothesRequest request,
		Authentication authentication) {
		clothesService.createClothes(request, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("옷이 성공적으로 등록되었습니다."));
	}

	@PutMapping("/{clothesId}")
	public ResponseEntity<ApiResponseDto<Void>> updateClothes(
		@PathVariable String clothesId,
		@Valid ClothesRequest request,
		Authentication authentication) {
		clothesService.updateClothes(clothesId, request, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("옷이 성공적으로 수정되었습니다.", null));
	}

	@GetMapping
	public ResponseEntity<ApiResponseDto<List<ClothesResponse>>> getUserClothes(
		Authentication authentication) {
		List<ClothesResponse> clothesList = clothesService.getUserClothes(authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("옷 목록 조회 성공", clothesList));
	}

	@GetMapping("/{clothesId}")
	public ResponseEntity<ApiResponseDto<ClothesDetailResponse>> getClothesDetail(
		@PathVariable String clothesId,
		Authentication authentication) {
		ClothesDetailResponse clothes = clothesService.getClothesDetail(clothesId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("옷 상세 조회 성공", clothes));
	}

	@DeleteMapping("/{clothesId}")
	public ResponseEntity<ApiResponseDto<Void>> deleteClothes(
		@PathVariable String clothesId,
		Authentication authentication) {
		clothesService.deleteClothes(clothesId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("옷이 성공적으로 삭제되었습니다.", null));
	}

	@DeleteMapping("/bulk")
	public ResponseEntity<ApiResponseDto<Void>> bulkDeleteClothes(
		@RequestBody List<String> clothesIds,
		Authentication authentication) {
		clothesService.bulkDeleteClothes(clothesIds, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("선택한 옷이 성공적으로 삭제되었습니다.", null));
	}
}
