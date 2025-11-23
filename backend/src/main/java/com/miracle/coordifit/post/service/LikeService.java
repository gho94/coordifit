package com.miracle.coordifit.post.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miracle.coordifit.post.model.Like;
import com.miracle.coordifit.post.repository.LikeRepository;
import com.miracle.coordifit.user.dto.UserDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeService implements ILikeService {

	private final LikeRepository likeRepository;

	@Override
	@Transactional
	public void toggleLike(String targetId, String targetType, String userId) {
		int isCurrentlyLiked = likeRepository.isLiked(userId, targetId);

		if (isCurrentlyLiked > 0) {
			likeRepository.deleteLike(userId, targetId);
		} else {
			Like like = Like.builder()
				.userId(userId)
				.targetId(targetId)
				.createdBy(userId)
				.build();

			likeRepository.insertLike(like);
		}

		if ("POST".equals(targetType)) {
			likeRepository.updatePostLikeCount(targetId);
		} else if ("COMMENT".equals(targetType)) {
			likeRepository.updateCommentLikeCount(targetId);
		}
	}

	@Override
	public List<UserDto> getLikeUsers(String targetId) {
		return likeRepository.getLikeUsersByTargetId(targetId);
	}
}
