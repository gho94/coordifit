package com.miracle.coordifit.common.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miracle.coordifit.common.dto.CategoryResponseDto;
import com.miracle.coordifit.common.dto.CategoryResponseDto.CategoryItem;
import com.miracle.coordifit.common.model.CommonCode;
import com.miracle.coordifit.common.repository.CommonCodeRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class CommonCodeService implements ICommonCodeService {
	private final CommonCodeRepository commonCodeRepository;

	@Override
	@CacheEvict(value = "commonCodes", allEntries = true, beforeInvocation = false)
	public void createCommonCode(CommonCode commonCode, String userId) {
		String codeId = generateCodeId(commonCode.getParentCodeId());
		commonCode.setCodeId(codeId);
		commonCode.setCreatedBy(userId);
		int result = commonCodeRepository.insertCommonCode(commonCode);
		if (result <= 0) {
			throw new RuntimeException("공통 코드 생성 실패");
		}
	}

	private String generateCodeId(String parentCodeId) {
		String header;

		if (parentCodeId == null) {
			header = selectLastCodeHeader();
		} else {
			char firstChar = parentCodeId.charAt(0);
			header = String.valueOf(firstChar) + (Integer.parseInt(parentCodeId.substring(1, 2)) + 1);
		}

		return createLastCodeId(header);
	}

	private String selectLastCodeHeader() {
		String lastCodeId = commonCodeRepository.selectLastCodeId();
		String codeHeader = "A0";

		if (lastCodeId != null && !lastCodeId.isEmpty()) {
			char firstChar = lastCodeId.charAt(0);
			char nextChar = (char)(firstChar + 1);
			codeHeader = String.valueOf(nextChar) + "0";
		}

		return codeHeader;
	}

	private String createLastCodeId(String header) {
		String lastCodeId = commonCodeRepository.selectLastCodeIdByHeader(header + "%");

		String codeId = header + "0001";

		if (lastCodeId != null && !lastCodeId.isEmpty()) {
			String lastNumberStr = lastCodeId.substring(header.length());
			int lastNumber = Integer.parseInt(lastNumberStr);
			codeId = header + String.format("%04d", lastNumber + 1);
		}

		return codeId;
	}

	@Override
	@Cacheable(value = "commonCodes", key = "'all'")
	public Map<String, CommonCode> getCommonCodes() {
		List<CommonCode> commonCodes = commonCodeRepository.selectCommonCodes();
		return createCommonCodeMap(commonCodes);
	}

	@Override
	@Cacheable(value = "commonCodes", key = "'code:' + #codeId")
	public CommonCode getCommonCodeByCodeId(String codeId) {
		return commonCodeRepository.selectCommonCodeByCodeId(codeId);
	}

	@Override
	@CacheEvict(value = "commonCodes", allEntries = true, beforeInvocation = false)
	public void updateCommonCode(CommonCode commonCode, String codeId, String userId) {
		commonCode.setCodeId(codeId);
		commonCode.setUpdatedBy(userId);
		int result = commonCodeRepository.updateCommonCode(commonCode);
		if (result <= 0) {
			throw new RuntimeException("공통 코드 수정 실패");
		}
	}

	@Override
	@CacheEvict(value = "commonCodes", allEntries = true, beforeInvocation = false)
	public void deleteCommonCode(String codeId) {
		int result = commonCodeRepository.deleteCommonCode(codeId);
		if (result <= 0) {
			throw new RuntimeException("공통 코드 삭제 실패");
		}
	}

	private Map<String, CommonCode> createCommonCodeMap(List<CommonCode> commonCodes) {
		Map<String, CommonCode> commonCodeMap = new LinkedHashMap<>();

		for (CommonCode commonCode : commonCodes) {
			if (commonCode.getLevel() == 1) {
				if (!commonCodeMap.containsKey(commonCode.getCodeId())) {
					commonCodeMap.put(commonCode.getCodeId(), commonCode);
				}
			} else {
				createChildCodeMap(commonCodeMap, commonCode);
			}
		}

		return commonCodeMap;
	}

	private void createChildCodeMap(Map<String, CommonCode> commonCodeMap, CommonCode childCode) {
		for (CommonCode rootCode : commonCodeMap.values()) {
			if (rootCode.getCodeId().equals(childCode.getParentCodeId())) {
				if (rootCode.getChildren().containsKey(childCode.getParentCodeId())) {
					rootCode.getChildren().get(childCode.getParentCodeId())
						.getChildren().put(childCode.getCodeId(), childCode);
				} else {
					rootCode.getChildren().put(childCode.getCodeId(), childCode);
				}
			} else {
				createChildCodeMap(rootCode.getChildren(), childCode);
			}
		}
	}

	@Override
	@Cacheable(value = "commonCodes", key = "'parent:' + #parentCodeId")
	public List<CommonCode> getCommonCodesByParentCodeId(String parentCodeId) {
		return commonCodeRepository.selectCommonCodesByParentCodeId(parentCodeId);
	}

	@Override
	@Cacheable(value = "commonCodes", key = "'categoryData'")
	public CategoryResponseDto getCategoryData() {
		Map<String, CommonCode> allCodes = getCommonCodes();
		CommonCode categoryGroup = allCodes.get("B00001")
			.getChildren().get("B10001");

		if (categoryGroup == null || categoryGroup.getChildren() == null) {
			return CategoryResponseDto.builder()
				.mainCategories(new ArrayList<>())
				.subCategoriesMap(new LinkedHashMap<>())
				.build();
		}

		// Main categories 변환 (전체 옵션 포함)
		List<CategoryItem> mainCategories = new ArrayList<>();
		mainCategories.add(CategoryItem.builder().codeId("all").codeName("전체").children(new LinkedHashMap<>()).build());
		mainCategories.addAll(categoryGroup.getChildren().values().stream()
			.map(this::toCategoryItem)
			.collect(Collectors.toList()));

		// Sub categories map 생성
		Map<String, List<CategoryItem>> subCategoriesMap = new LinkedHashMap<>();
		categoryGroup.getChildren().values().forEach(mainCategory -> {
			List<CategoryItem> subs = new ArrayList<>();
			subs.add(CategoryItem.builder().codeId("all").codeName("전체").build());

			if (mainCategory.getChildren() != null) {
				subs.addAll(mainCategory.getChildren().values().stream()
					.map(
						child -> CategoryItem.builder().codeId(child.getCodeId()).codeName(child.getCodeName()).build())
					.collect(Collectors.toList()));
			}
			subCategoriesMap.put(mainCategory.getCodeId(), subs);
		});

		return CategoryResponseDto.builder()
			.mainCategories(mainCategories)
			.subCategoriesMap(subCategoriesMap)
			.build();
	}

	private CategoryItem toCategoryItem(CommonCode code) {
		Map<String, CategoryItem> children = new LinkedHashMap<>();
		if (code.getChildren() != null) {
			code.getChildren().values().forEach(child -> {
				children.put(child.getCodeId(), toCategoryItem(child));
			});
		}
		return CategoryItem.builder()
			.codeId(code.getCodeId())
			.codeName(code.getCodeName())
			.children(children)
			.build();
	}
}
