package com.miracle.coordifit.post.service;

import java.util.List;

import com.miracle.coordifit.user.dto.UserDto;

public interface ILikeService {

	void toggleLike(String targetId, String targetType, String userId);

	List<UserDto> getLikeUsers(String targetId);
}
