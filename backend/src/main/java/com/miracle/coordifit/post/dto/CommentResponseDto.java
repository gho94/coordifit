package com.miracle.coordifit.post.dto;

import java.time.LocalDateTime;

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
public class CommentResponseDto {
	private String commentId;
	private String postId;
	private String userId;
	private String nickname;
	private String profileImageUrl;
	private String parentId;
	private String content;
	private Integer likeCount;
	private LocalDateTime createdAt;
	private boolean isLiked;
}
