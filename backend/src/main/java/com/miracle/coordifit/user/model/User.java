package com.miracle.coordifit.user.model;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "password")
@Builder
public class User {
	private String userId;
	private String email;
	private String password;
	private String nickname;
	private Long fileId;
	private String loginTypeCode;
	private String kakaoId;
	private String genderCode;
	private LocalDateTime birthDate;
	private String isActive;
	private LocalDateTime createdAt;
	private String createdBy;
	private LocalDateTime updatedAt;
	private String updatedBy;
	private LocalDateTime loginedAt;
}
