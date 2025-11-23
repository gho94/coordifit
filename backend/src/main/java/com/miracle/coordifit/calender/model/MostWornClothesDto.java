package com.miracle.coordifit.calender.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MostWornClothesDto {
	private String clothesId;
	private String name;
	private String imageUrl;
	private int wearCount;

	public static MostWornClothesDto empty() {
		return MostWornClothesDto.builder()
			.clothesId(null)
			.name(null)
			.imageUrl(null)
			.wearCount(0)
			.build();
	}
}
