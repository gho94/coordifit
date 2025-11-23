package com.miracle.coordifit.fitting.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 클라이언트로부터 이미지 생성 요청을 받을 때 사용되는 DTO.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromptRequestDTO {
	private String prompt;
}
