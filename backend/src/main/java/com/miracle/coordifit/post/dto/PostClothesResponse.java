package com.miracle.coordifit.post.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostClothesResponse {
	private String clothesId;
	private String name;
	private String brand;
	private Integer price;
	private String imageUrl;
}
