package com.miracle.coordifit.coordi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CoordiResponse {
	private String coordiId;
	private String userId;
	private String coordiName;
	private String description;
	private String canvasJson;
	private String originImageUrl;
	private String thumbImageUrl;
	private String aiImageUrl;

	public static CoordiResponse empty() {
		return CoordiResponse.builder().build();
	}
}
