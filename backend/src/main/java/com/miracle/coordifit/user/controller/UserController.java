package com.miracle.coordifit.user.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.auth.service.IJwtService;
import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.user.dto.MyPageResponseDto;
import com.miracle.coordifit.user.dto.ProfileUpdateRequestDto;
import com.miracle.coordifit.user.dto.UserDto;
import com.miracle.coordifit.user.model.User;
import com.miracle.coordifit.user.service.IFollowService;
import com.miracle.coordifit.user.service.IUserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
	private final IUserService userService;
	private final IJwtService jwtService;
	private final IFollowService followService;

	@PutMapping("/{userId}")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> updateProfile(
		@PathVariable("userId") String userId,
		ProfileUpdateRequestDto requestDto) {
		User updatedUser = userService.updateUserProfile(userId, requestDto);

		Map<String, Object> tokenData = jwtService.createTokens(updatedUser);
		return ResponseEntity.ok(ApiResponseDto.success("프로필이 성공적으로 업데이트되었습니다.", tokenData));
	}

	@DeleteMapping("/{userId}")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> toggleUserActive(
		@PathVariable("userId") String userId,
		@RequestParam(value = "isActive", defaultValue = "N") String isActive) {
		userService.toggleUserActive(userId);
		if ("Y".equals(isActive)) {
			Map<String, Object> tokenData = activateUser(userId);
			return ResponseEntity.ok(ApiResponseDto.success("계정 활성 완료", tokenData));
		} else {
			deactivateUser(userId);
			return ResponseEntity.ok(ApiResponseDto.success("계정 비활성 완료"));
		}
	}

	private void deactivateUser(String userId) {
		jwtService.deleteAllUserTokens(userId);
	}

	private Map<String, Object> activateUser(String userId) {
		User user = userService.getUserById(userId);
		if (user == null) {
			throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
		}
		return jwtService.createTokens(user);
	}

	@PostMapping("/{userId}/follow")
	public ResponseEntity<ApiResponseDto<Void>> toggleFollow(
		@PathVariable String userId,
		Authentication authentication) {
		followService.toggleFollow(authentication.getName(), userId);
		return ResponseEntity.ok(ApiResponseDto.success("팔로우 처리 완료"));
	}

	@GetMapping("/{userId}/follow")
	public ResponseEntity<ApiResponseDto<Boolean>> checkFollowing(
		@PathVariable String userId,
		Authentication authentication) {
		boolean isFollowing = followService.isFollowing(authentication.getName(), userId);
		return ResponseEntity.ok(ApiResponseDto.success("팔로우 상태 조회 성공", isFollowing));
	}

	@GetMapping("/{userId}/followers")
	public ResponseEntity<ApiResponseDto<List<UserDto>>> getFollowers(
		@PathVariable String userId) {
		List<UserDto> followers = followService.getFollowers(userId);
		return ResponseEntity.ok(ApiResponseDto.success("팔로워 목록 조회 성공", followers));
	}

	@GetMapping("/{userId}/followings")
	public ResponseEntity<ApiResponseDto<List<UserDto>>> getFollowings(
		@PathVariable String userId) {
		List<UserDto> followings = followService.getFollowings(userId);
		return ResponseEntity.ok(ApiResponseDto.success("팔로잉 목록 조회 성공", followings));
	}

	@GetMapping("/{userId}")
	public ResponseEntity<ApiResponseDto<MyPageResponseDto>> getMyPageInfo(
		@PathVariable String userId,
		Authentication authentication) {
		MyPageResponseDto myPageInfo = userService.getMyPageInfo(userId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("마이페이지 정보 조회 성공", myPageInfo));
	}
}
