package com.miracle.coordifit.post.model;

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
public class Post {
	private String postId;
	private String userId;
	private String content;
	private String isPublic;
	private Integer viewCount;
	private Integer likeCount;
	private Integer commentCount;
	private String isActive;
	private LocalDateTime createdAt;
	private String createdBy;
	private LocalDateTime updatedAt;
	private String updatedBy;
}
