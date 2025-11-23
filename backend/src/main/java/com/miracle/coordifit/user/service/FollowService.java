package com.miracle.coordifit.user.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miracle.coordifit.user.dto.UserDto;
import com.miracle.coordifit.user.model.Follow;
import com.miracle.coordifit.user.repository.FollowRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FollowService implements IFollowService {

	private final FollowRepository followRepository;

	@Override
	@Transactional
	public void toggleFollow(String currentUserId, String userId) {
		if (currentUserId.equals(userId)) {
			throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다.");
		}

		int isCurrentlyFollowing = followRepository.isFollowing(currentUserId, userId);

		if (isCurrentlyFollowing > 0) {
			followRepository.deleteFollow(currentUserId, userId);
		} else {
			Follow follow = Follow.builder()
				.followerId(currentUserId)
				.followingId(userId)
				.createdBy(currentUserId)
				.build();

			followRepository.insertFollow(follow);
		}
	}

	@Override
	public boolean isFollowing(String currentUserId, String userId) {
		return followRepository.isFollowing(currentUserId, userId) > 0;
	}

	@Override
	public List<UserDto> getFollowers(String userId) {
		return followRepository.getFollowers(userId);
	}

	@Override
	public List<UserDto> getFollowings(String userId) {
		return followRepository.getFollowings(userId);
	}
}
