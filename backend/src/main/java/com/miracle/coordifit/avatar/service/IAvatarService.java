package com.miracle.coordifit.avatar.service;

import java.util.List;

import com.miracle.coordifit.avatar.dto.AvatarCreateRequest;
import com.miracle.coordifit.avatar.dto.AvatarResponse;

public interface IAvatarService {
	AvatarResponse createAvatar(String userId, AvatarCreateRequest request);

	List<AvatarResponse> getAvatars(String userId);

	void deleteAvatar(String userId, String avatarId);
}
