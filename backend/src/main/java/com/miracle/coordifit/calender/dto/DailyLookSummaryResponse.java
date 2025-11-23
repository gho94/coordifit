package com.miracle.coordifit.calender.dto;

import com.miracle.coordifit.calender.model.MostWornClothesDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyLookSummaryResponse {
	private int totalDailyLookCount;
	private MostWornClothesDto mostWornClothesOverall;
	private MostWornClothesDto mostWornClothesThisMonth;
}
