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
public class Like {
	private String userId;
	private String targetId;
	private LocalDateTime createdAt;
	private String createdBy;
}
