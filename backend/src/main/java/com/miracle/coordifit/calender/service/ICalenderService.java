package com.miracle.coordifit.calender.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.calender.dto.DailyLookResponse;
import com.miracle.coordifit.calender.dto.DailyLookSummaryResponse;
import com.miracle.coordifit.calender.model.DailyLook;

public interface ICalenderService {
	// 데일리룩 저장
	DailyLook insertDailyLook(String userId, String wearDate, MultipartFile image, String description,
		String itemsJson);

	// 데일리룩 업데이트
	DailyLook updateDailyLook(String userId, String wearDate, MultipartFile image, String description,
		String itemsJson);

	// 데일리룩 삭제
	DailyLook deleteDailyLookByDate(String userId, String wearDate);

	// 특정 월 데일리룩 조회
	List<DailyLookResponse> getDailyLooksByMonth(String userId, String yearMonth);

	// 특정 날짜 데일리룩 조회
	DailyLookResponse getDailyLookByDate(String userId, String wearDate);

	// 데일리룩 통계
	DailyLookSummaryResponse getDailyLookSummary(String userId, String yearMonth);
}
