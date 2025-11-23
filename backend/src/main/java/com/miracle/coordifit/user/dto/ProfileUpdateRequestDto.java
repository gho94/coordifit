package com.miracle.coordifit.user.dto;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class ProfileUpdateRequestDto {
	private String nickname;
	private String genderCode;
	private String birthDate;
	private String isActive;
	private MultipartFile file;
}
