package com.miracle.coordifit.clothes.dto;

import java.time.LocalDate;

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
public class ClothesResponse {
	private String clothesId;
	private String name;
	private String brand;
	private Integer price;
	private String categoryCode;
	private LocalDate purchaseDate;
	private String imageUrl;
	private Integer wearCount;
	private LocalDate lastWornDate;
}
