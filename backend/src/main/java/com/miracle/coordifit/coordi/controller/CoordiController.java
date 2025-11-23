package com.miracle.coordifit.coordi.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.common.dto.Base64ImageDto;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.service.IFileService;
import com.miracle.coordifit.coordi.dto.CoordiResponse;
import com.miracle.coordifit.coordi.model.Coordi;
import com.miracle.coordifit.coordi.service.ICoordiService;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/coordi")
@RequiredArgsConstructor
@Slf4j
public class CoordiController {
	private final ICoordiService coordiService;
	private final IFileService fileService;

	@GetMapping
	public ResponseEntity<ApiResponseDto<?>> getAllCoordis(Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		log.info(">> get user ID Whern getAllCoordis {}", userId);

		try {
			log.info(">> GET /api/coordi - getAllCoordis for userId={}", userId);
			List<CoordiResponse> coordiList = coordiService.getAllCoordisByUser(userId);

			return ResponseEntity.ok(ApiResponseDto.success("코디가 성공적으로 조회되었습니다.", coordiList));

		} catch (IllegalArgumentException e) {
			log.error("코디 조회 실패(잘못된 요청) : {}", e.getMessage());

			return ResponseEntity.badRequest().body(ApiResponseDto.error(e.getMessage()));
		} catch (Exception e) {
			log.error("코디 조회 실패: {}", e.getMessage());

			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(ApiResponseDto.error("코디 조회중 오류가 발생했습니다." + e.getMessage()));
		}
	};

	@GetMapping("/{coordiId}")
	public ResponseEntity<ApiResponseDto<?>> getCoordById(
		@PathVariable String coordiId,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		try {
			log.info(">> GET /api/coordi/{} - getCoordById for userId={}", coordiId, userId);
			CoordiResponse coordi = coordiService.getCoordiById(coordiId);

			return ResponseEntity.ok(ApiResponseDto.success("코디 조회 성공", coordi));
		} catch (Exception e) {
			log.error(">> getCoordById failed", e);

			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("코디 조회 실패", e.getMessage()));
		}
	}

	@Transactional
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponseDto<?>> createCoordi(
		@RequestPart("image") MultipartFile image,
		@RequestParam("canvasJson") @NotBlank String canvasJson,
		@RequestParam("coordiName") @NotBlank String coordiName,
		@RequestParam(value = "description", required = false) String description,
		@RequestParam(value = "dataUrl", required = false) String dataUrl,
		Authentication authentication) {
		final String userId = (String)authentication.getPrincipal();
		try {
			log.info(">> POST /api/coordi - userId={}", userId);

			FileInfo imageInfo = fileService.uploadFileWithThumbnail(image);

			Coordi result = coordiService.insertCoordi(userId, canvasJson, coordiName, description,
				imageInfo.getFileId());

			Integer aiFileId = null;

			if (dataUrl != null && !dataUrl.isBlank()) {
				Base64ImageDto dto = new Base64ImageDto();
				dto.setDataUrl(dataUrl);

				FileInfo aiImage = fileService.uploadBase64(dto);
				aiFileId = aiImage.getFileId();

				int updated = coordiService.updateAiFileId(result.getCoordiId(), aiFileId);
				if (updated <= 0) {
					log.warn(">> updateCoordi: ai_file_id 반영 실패 (coordiId={})", result.getCoordiId());
				}
			}

			URI location = URI.create("/api/coordi/" + result.getCoordiId());

			Map<String, Object> body = Map.of("coordiId", result.getCoordiId());

			return ResponseEntity.created(location).body(ApiResponseDto.success("코디 등록 성공", body));

		} catch (Exception e) {
			log.error(">> createCoordi failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("코디 저장 실패", e.getMessage()));
		}
	}

	@Transactional
	@PutMapping("/{coordiId}/ai-image")
	public ResponseEntity<ApiResponseDto<?>> updateCoordiAiFile(
		@PathVariable("coordiId") @NotBlank String coordiId,
		@RequestBody Base64ImageDto dto,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		try {
			log.info(">> PUT /api/coordi/{}/ai-image - userId={}", coordiId, userId);

			FileInfo aiImage = fileService.uploadBase64(dto);
			Integer aiFileId = aiImage.getFileId();

			int updated = coordiService.updateAiFileId(coordiId, aiFileId);
			if (updated <= 0) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(ApiResponseDto.error("대상 코디를 찾을 수 없습니다.", "coordiId=" + coordiId));
			}

			Map<String, Object> body = Map.of(
				"coordiId", coordiId,
				"aiFileId", aiFileId,
				"aiImageUrl", aiImage.getS3Url());

			return ResponseEntity.ok(ApiResponseDto.success("AI 이미지가 업데이트되었습니다.", body));

		} catch (Exception e) {
			log.error(">> updateCoordiAiImage failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("AI 이미지 업데이트 실패", e.getMessage()));
		}
	}

	@Transactional
	@PutMapping(value = "/{coordiId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponseDto<?>> updateCoordi(
		@PathVariable("coordiId") @NotBlank String coordiId,
		@RequestPart(value = "image") MultipartFile image,
		@RequestParam("canvasJson") @NotBlank String canvasJson,
		@RequestParam("coordiName") @NotBlank String coordiName,
		@RequestParam(value = "description") String description,
		@RequestParam(value = "dataUrl", required = false) String dataUrl,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		try {
			log.info(">> PUT /api/coordi/{} - userId={}", coordiId, userId);

			FileInfo originImage = fileService.uploadFileWithThumbnail(image);
			int fileId = originImage.getFileId();

			Coordi result = coordiService.updateCoordi(userId, canvasJson, coordiName, description, fileId, coordiId);

			Integer aiFileId = null;

			if (dataUrl != null && !dataUrl.isBlank()) {
				Base64ImageDto dto = new Base64ImageDto();
				dto.setDataUrl(dataUrl);

				FileInfo aiImage = fileService.uploadBase64(dto);
				aiFileId = aiImage.getFileId();

				int updated = coordiService.updateAiFileId(coordiId, aiFileId);
				if (updated <= 0) {
					log.warn(">> updateCoordi: ai_file_id 반영 실패 (coordiId={})", coordiId);
				}
			}

			Map<String, Object> body = new HashMap<>();
			body.put("coordiId", result.getCoordiId());
			body.put("fileId", fileId);

			return ResponseEntity.ok(ApiResponseDto.success("코디 수정 성공", body));

		} catch (Exception e) {
			log.error(">> updateCoordi failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("코디 수정 실패", e.getMessage()));
		}
	}

	@Transactional
	@DeleteMapping("/{coordiId}")
	public ResponseEntity<ApiResponseDto<?>> deleteCoordi(
		@PathVariable String coordiId,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();
		try {
			log.info(">> DELETE /api/coordi/{} - userId={}", coordiId, userId);
			coordiService.deleteCoordi(coordiId, userId);
			return ResponseEntity.ok(ApiResponseDto.success("코디 삭제 성공", coordiId));
		} catch (Exception e) {
			log.error(">> deleteCoordi failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("코디 삭제 실패", e.getMessage()));
		}
	}

	@Transactional
	@DeleteMapping
	public ResponseEntity<ApiResponseDto<?>> deleteCoordis(@RequestBody List<String> coordiIds,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		log.info("DELETE /api/coordi - 다중 삭제 요청: {}", coordiIds);
		coordiService.deleteCoordis(coordiIds, userId);
		return ResponseEntity.ok(ApiResponseDto.success("코디 다중 삭제 성공", coordiIds));
	}
}
