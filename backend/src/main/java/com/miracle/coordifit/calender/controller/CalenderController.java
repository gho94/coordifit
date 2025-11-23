package com.miracle.coordifit.calender.controller;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.calender.dto.DailyLookResponse;
import com.miracle.coordifit.calender.dto.DailyLookSummaryResponse;
import com.miracle.coordifit.calender.model.DailyLook;
import com.miracle.coordifit.calender.service.ICalenderService;
import com.miracle.coordifit.common.dto.ApiResponseDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/daily-look")
@RequiredArgsConstructor
@Slf4j
public class CalenderController {
	private final ICalenderService calenderService;

	@Transactional
	@GetMapping("/date")
	public ResponseEntity<ApiResponseDto<?>> getDailyLooks(
		@RequestParam(value = "yearMonth", required = false) String yearMonth,
		@RequestParam(value = "wearDate", required = false) String wearDate,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		if (wearDate != null) {
			// 특정 날짜 조회
			DailyLookResponse dailyLook = calenderService.getDailyLookByDate(userId, wearDate);

			return ResponseEntity.ok()
				.body(ApiResponseDto.success(String.format("%s 날짜의 데일리룩 데이터 조회 성공", wearDate), dailyLook));
		} else if (yearMonth != null) {
			// 월별 조회
			List<DailyLookResponse> monthlyDailyLooks = calenderService.getDailyLooksByMonth(userId, yearMonth);

			return ResponseEntity.ok()
				.body(ApiResponseDto.success(String.format("%s 월별 데일리룩 데이터 조회 성공", yearMonth), monthlyDailyLooks));
		}

		return ResponseEntity.badRequest()
			.body(ApiResponseDto.error("yearMonth 또는 wearDate 파라미터를 제공해야 합니다."));
	}

	@GetMapping("/summary")
	public ResponseEntity<ApiResponseDto<?>> getStatistics(@RequestParam String yearMonth,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		DailyLookSummaryResponse data = calenderService.getDailyLookSummary(userId, yearMonth);

		return ResponseEntity.ok(ApiResponseDto.success("월간 통계 조회 성공", data));
	}

	@DeleteMapping("/date/{wearDate:\\d{4}-\\d{2}-\\d{2}}")
	@Transactional
	public ResponseEntity<ApiResponseDto<?>> deleteDailyLook(
		@PathVariable("wearDate") String wearDate,
		Authentication authentication) {
		String userId = (String)authentication.getPrincipal();

		try {
			log.info("데일리룩 삭제 요청: wearDate={}, userId={}", wearDate, userId);

			DailyLook deletedTarget = calenderService.deleteDailyLookByDate(userId, wearDate);

			if (deletedTarget == null) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(ApiResponseDto.error(String.format("%s 날짜의 데일리룩을 찾을 수 없습니다.", wearDate)));
			}

			log.info("삭제된 데일리룩: {}", deletedTarget.toString());

			Map<String, Object> body = new HashMap<>();
			body.put("dailyLookId", deletedTarget.getDailylookId());
			body.put("wearDate", deletedTarget.getWearDate());
			body.put("description", deletedTarget.getDescription());

			return ResponseEntity.ok()
				.body(ApiResponseDto.success(String.format("%s 날짜의 데일리룩 삭제 성공", wearDate), body));

		} catch (Exception e) {
			log.error("❌ 데일리룩 삭제 중 오류 발생: {}", e.getMessage(), e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("데일리룩 삭제 중 오류가 발생했습니다."));
		}
	}

	@Transactional
	@PostMapping("/date/{wearDate:\\d{4}-\\d{2}-\\d{2}}")
	public ResponseEntity<ApiResponseDto<?>> createDailyLook(
		@PathVariable("wearDate") String wearDate,
		@RequestPart("image") MultipartFile image,
		@RequestParam("description") String description,
		@RequestPart("items") String itemsJson,
		Authentication authentication) {

		String userId = (String)authentication.getPrincipal();

		try {
			DailyLook result = calenderService.insertDailyLook(userId, wearDate, image, description, itemsJson);

			URI location = URI.create("/api/daily-look/date/" + wearDate);
			Map<String, Object> body = Map.of(
				"dailyLookId", result.getDailylookId());

			return ResponseEntity.created(location)
				.body(ApiResponseDto.success("데일리룩 등록 성공", body));

		} catch (Exception e) {
			log.error(">> create DailyLook failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("데일리룩 저장 실패", e.getMessage()));
		}
	}

	@Transactional
	@PutMapping("/date/{wearDate:\\d{4}-\\d{2}-\\d{2}}")
	public ResponseEntity<ApiResponseDto<?>> updateDailyLook(
		@PathVariable("wearDate") String wearDate,
		@RequestPart("image") MultipartFile image,
		@RequestParam("description") String description,
		@RequestPart("items") String itemsJson,
		Authentication authentication) {

		String userId = (String)authentication.getPrincipal();

		try {
			DailyLook result = calenderService.updateDailyLook(userId, wearDate, image, description, itemsJson);

			if (result.getDailylookId() == null) {
				return ResponseEntity.badRequest()
					.body(ApiResponseDto.error(String.format("%s 날짜의 데일리룩을 찾을 수 없습니다.", wearDate)));
			}

			Map<String, Object> body = Map.of("dailyLookId", result.getDailylookId());

			return ResponseEntity.ok(ApiResponseDto.success("데일리룩 수정 성공", body));

		} catch (Exception e) {
			log.error(">> update DailyLook failed", e);
			return ResponseEntity.internalServerError()
				.body(ApiResponseDto.error("데일리룩 수정 실패", e.getMessage()));
		}
	}
}
