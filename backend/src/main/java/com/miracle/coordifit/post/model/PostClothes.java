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
public class PostClothes {
	private String postId;
	private String clothesId;
	private LocalDateTime createdAt;
	private String createdBy;
}
