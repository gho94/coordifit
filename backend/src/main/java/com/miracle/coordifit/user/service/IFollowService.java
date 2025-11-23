package com.miracle.coordifit.user.service;

import java.util.List;

import com.miracle.coordifit.user.dto.UserDto;

public interface IFollowService {

	void toggleFollow(String currentUserId, String userId);

	boolean isFollowing(String currentUserId, String userId);

	List<UserDto> getFollowers(String userId);

	List<UserDto> getFollowings(String userId);
}
