package com.miracle.coordifit.avatar.dto;

import org.springframework.web.multipart.MultipartFile;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AvatarCreateRequest {
	private String avatarName;
	private MultipartFile avatarFile;
}
