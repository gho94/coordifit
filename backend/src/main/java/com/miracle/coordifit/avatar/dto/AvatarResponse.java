package com.miracle.coordifit.avatar.dto;

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
public class AvatarResponse {
	private String avatarId;
	private String userId;
	private String avatarName;
	private Long fileId;
	private String originalFileName;
	private String fileUrl;
	private String isActive;
	private LocalDateTime createdAt;
	private String createdBy;
	private LocalDateTime updatedAt;
	private String updatedBy;
}
