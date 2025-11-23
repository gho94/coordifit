package com.miracle.coordifit.user.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.user.dto.MyPageResponseDto;
import com.miracle.coordifit.user.model.User;

@Mapper
public interface UserRepository {
	int insertUser(User user);

	User selectUser(User user);

	int updateUser(User user);

	int getNextUserSequence();

	MyPageResponseDto getMyPageInfo(@Param("userId") String userId);
}
