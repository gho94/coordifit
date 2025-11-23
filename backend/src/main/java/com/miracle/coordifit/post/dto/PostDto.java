package com.miracle.coordifit.post.dto;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

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
public class PostDto {
	private String postId;
	private String imageUrl;
	private String userId;
	private String nickname;
	private String profileImageUrl;
	private String content;
	private Integer likeCount;
	private boolean isLiked;

	@JsonIgnore
	private String categoryCodesStr;

	@JsonProperty("categoryCodes")
	public List<String> getCategoryCodes() {
		if (categoryCodesStr == null || categoryCodesStr.isEmpty()) {
			return Collections.emptyList();
		}
		return Arrays.asList(categoryCodesStr.split(","));
	}
}
