package com.miracle.coordifit.common.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponseDto {
	private List<CategoryItem> mainCategories;
	private Map<String, List<CategoryItem>> subCategoriesMap;

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CategoryItem {
		private String codeId;
		private String codeName;
		private Map<String, CategoryItem> children;
	}
}
