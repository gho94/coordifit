package com.miracle.coordifit.clothes.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClothesDetailResponse {
	private String clothesId;
	private String name;
	private String brand;
	private String categoryCode;
	private String clothesSize;
	private Integer price;
	private LocalDate purchaseDate;
	private String purchaseUrl;
	private String description;
	private Integer wearCount;
	private LocalDate lastWornDate;
	private List<ClothesImage> images;

	@Getter
	@Setter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class ClothesImage {
		private Long fileId;
		private String url;
	}
}
