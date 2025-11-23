package com.miracle.coordifit.coordi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoordiAiImageRequest {
	private String coordiId;
	private String base64;
	private String fileName;
}
