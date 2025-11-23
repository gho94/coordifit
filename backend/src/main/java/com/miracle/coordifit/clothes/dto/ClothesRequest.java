package com.miracle.coordifit.clothes.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class ClothesRequest {
	@NotBlank(message = "옷 이름은 필수입니다.")
	@Size(max = 100, message = "옷 이름은 최대 100자까지 입력 가능합니다.")
	private String name;

	@NotBlank(message = "브랜드명은 필수입니다.")
	@Size(max = 100, message = "브랜드명은 최대 100자까지 입력 가능합니다.")
	private String brand;

	@NotBlank(message = "카테고리는 필수입니다.")
	private String categoryCode;

	@Size(max = 20, message = "사이즈는 최대 20자까지 입력 가능합니다.")
	private String clothesSize;

	private Integer price;
	private String purchaseDate;

	@Size(max = 1000, message = "구매 링크는 최대 1000자까지 입력 가능합니다.")
	private String purchaseUrl;

	@Size(max = 1000, message = "설명은 최대 1000자까지 입력 가능합니다.")
	private String description;

	private List<Long> deletedFileIds;
	private List<MultipartFile> files;
}
