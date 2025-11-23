package com.miracle.coordifit.common.model;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

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
public class CommonCode {
	private String codeId;
	private String codeName;
	private String parentCodeId;
	private String isActive;
	private int level;
	private String createdBy;
	private LocalDateTime createdAt;
	private String updatedBy;
	private LocalDateTime updatedAt;

	@Builder.Default
	private Map<String, CommonCode> children = new LinkedHashMap<>();
}
