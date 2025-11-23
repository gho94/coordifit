package com.miracle.coordifit.fitting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FittingAnalysisRequest {

	private String imageBase64;
	private String hint;
}
