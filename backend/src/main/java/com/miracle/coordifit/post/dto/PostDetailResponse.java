package com.miracle.coordifit.post.dto;

import java.util.List;

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
public class PostDetailResponse {
	private String postId;
	private String userId;
	private String nickname;
	private String profileImageUrl;
	private String content;
	private Boolean isPublic;
	private List<PostImage> images;
	private List<PostClothesResponse> clothes;
	private Integer viewCount;
	private Integer likeCount;
	private Integer commentCount;
	private String createdAt;
	private boolean isLiked;
	private List<CommentResponseDto> comments;

	@Getter
	@Setter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PostImage {
		private Long fileId;
		private String url;
	}
}
