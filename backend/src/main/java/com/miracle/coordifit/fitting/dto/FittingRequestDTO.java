package com.miracle.coordifit.fitting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 가상 피팅 요청 DTO (URL/Base64 기반)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FittingRequestDTO {
	// 아바타 이미지
	private String avatarImage; // 아바타 이미지 (URL 또는 Base64)

	// 의류 이미지 (URL 또는 Base64)
	private String topImage;
	private String bottomImage;
	private String shoesImage;
}
