package com.miracle.coordifit.avatar.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.avatar.dto.AvatarCreateRequest;
import com.miracle.coordifit.avatar.dto.AvatarResponse;
import com.miracle.coordifit.avatar.service.IAvatarService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/avatars")
@RequiredArgsConstructor
public class AvatarController {

	private final IAvatarService avatarService;

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> createAvatar(
		@RequestPart("avatar") MultipartFile avatarFile,
		@RequestPart(value = "avatarName", required = false) String avatarName,
		Authentication authentication // ✅ 추가
	) {
		try {
			String userId = authentication.getName(); // ✅ 인증된 사용자 ID 가져오기

			AvatarCreateRequest request = new AvatarCreateRequest();
			request.setAvatarName(avatarName);
			request.setAvatarFile(avatarFile);

			AvatarResponse response = avatarService.createAvatar(userId, request);
			return ResponseEntity.ok(success(response));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(error(e.getMessage()));
		} catch (Exception e) {
			return ResponseEntity.internalServerError().body(error("아바타 등록에 실패했습니다."));
		}
	}

	@GetMapping
	public ResponseEntity<?> getAvatars(Authentication authentication) {
		String userId = authentication.getName();
		List<AvatarResponse> avatars = avatarService.getAvatars(userId);
		return ResponseEntity.ok(success(avatars));
	}

	@DeleteMapping("/{avatarId}")
	public ResponseEntity<?> deleteAvatar(
		@PathVariable String avatarId,
		Authentication authentication) {
		String userId = authentication.getName();
		avatarService.deleteAvatar(userId, avatarId);
		return ResponseEntity.ok(success(Map.of("deleted", true)));
	}

	private Map<String, Object> success(Object data) {
		return Map.of(
			"success", true,
			"data", data);
	}

	private Map<String, Object> error(String message) {
		return Map.of(
			"success", false,
			"message", message);
	}
}
