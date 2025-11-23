package com.miracle.coordifit.clothes.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
public class Clothes {
	private String clothesId;
	private String userId;
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
	private String isActive;
	private LocalDateTime createdAt;
	private String createdBy;
	private LocalDateTime updatedAt;
	private String updatedBy;
}
