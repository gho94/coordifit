package com.miracle.coordifit.user.model;

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
public class Follow {
	private String followerId;
	private String followingId;
	private LocalDateTime createdAt;
	private String createdBy;
}
