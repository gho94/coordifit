package com.miracle.coordifit.calender.repository;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.calender.model.DailyLook;
import com.miracle.coordifit.calender.model.DailyLookItem;
import com.miracle.coordifit.calender.model.MostWornClothesDto;

@Mapper
public interface CalenderRepository {
	// 데일리룩 생성
	int insertDailyLook(DailyLook dailyLook);

	// 데일리룩 아이템 생성
	int insertDailyLookItem(DailyLookItem item);

	// 데일리룩 삭제
	int deleteDailyLookById(String dailylookId);

	// 데일리룩 아이템 삭제
	int deleteDailyLookItemsByDailyLookId(String dailylookId);

	// 특정 월 데일리룩 조회
	List<DailyLook> getDailyLooksByMonth(
		@Param("userId") String userId,
		@Param("yearMonth") String yearMonth);

	// 특정 날짜 데일리룩 조회
	Optional<DailyLook> getDailyLookByDate(
		@Param("userId") String userId,
		@Param("wearDate") String wearDate);

	// 데일리룩 수정
	int updateDailyLook(DailyLook dailyLook);

	// 데일리룩 Id 생성
	int getNextDailyLookSequence();

	// 데일리룩 통계
	int selectDailyLookCountByMonth(String userId, String yearMonth);

	MostWornClothesDto selectMostWornClothesByMonth(String userId, String yearMonth);

	MostWornClothesDto selectMostWornClothes(String userId);

	int deleteDailyLookByClothesId(@Param("clothesId") String clothesId, @Param("userId") String userId);
}
