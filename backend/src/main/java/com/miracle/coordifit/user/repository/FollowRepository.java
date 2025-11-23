package com.miracle.coordifit.user.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.user.dto.UserDto;
import com.miracle.coordifit.user.model.Follow;

@Mapper
public interface FollowRepository {

	int isFollowing(@Param("followerId") String followerId, @Param("followingId") String followingId);

	int insertFollow(Follow follow);

	int deleteFollow(@Param("followerId") String followerId, @Param("followingId") String followingId);

	List<UserDto> getFollowers(@Param("userId") String userId);

	List<UserDto> getFollowings(@Param("userId") String userId);
}
