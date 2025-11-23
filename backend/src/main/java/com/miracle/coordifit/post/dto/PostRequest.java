package com.miracle.coordifit.post.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Size;
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
public class PostRequest {
	@Size(max = 4000, message = "내용은 최대 4000자까지 입력 가능합니다.")
	private String content;

	private Boolean isPublic;
	private List<String> clothesIds;
	private List<Long> deletedFileIds;
	private List<MultipartFile> files;
}
