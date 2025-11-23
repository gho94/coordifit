package com.miracle.coordifit.avatar.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.avatar.dto.AvatarResponse;
import com.miracle.coordifit.avatar.model.UserAvatar;

@Mapper
public interface UserAvatarRepository {
	int insertAvatar(UserAvatar avatar);

	AvatarResponse selectAvatarById(@Param("avatarId") String avatarId);

	List<AvatarResponse> selectAvatarsByUser(@Param("userId") String userId);

	int getNextAvatarSequence();

	int deleteAvatar(@Param("avatarId") String avatarId, @Param("userId") String userId);
}
