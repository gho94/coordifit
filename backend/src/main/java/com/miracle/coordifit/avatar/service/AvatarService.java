package com.miracle.coordifit.avatar.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.avatar.dto.AvatarCreateRequest;
import com.miracle.coordifit.avatar.dto.AvatarResponse;
import com.miracle.coordifit.avatar.model.UserAvatar;
import com.miracle.coordifit.avatar.repository.UserAvatarRepository;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.service.IFileService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AvatarService implements IAvatarService {

	private static final String DEFAULT_ACTIVE_FLAG = "Y";

	private final UserAvatarRepository userAvatarRepository;
	private final IFileService fileService;

	@Override
	@Transactional
	public AvatarResponse createAvatar(String userId, AvatarCreateRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("요청 정보가 존재하지 않습니다.");
		}
		if (userId == null || userId.isBlank()) {
			throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
		}

		MultipartFile avatarFile = request.getAvatarFile();
		if (avatarFile == null || avatarFile.isEmpty()) {
			throw new IllegalArgumentException("아바타 이미지를 업로드해주세요.");
		}

		FileInfo savedFile = fileService.uploadFile(avatarFile);
		if (savedFile == null || savedFile.getFileId() == null) {
			throw new IllegalStateException("파일 저장에 실패했습니다.");
		}

		int sequence = userAvatarRepository.getNextAvatarSequence();
		String avatarId = String.format("A%06d", sequence);

		UserAvatar avatar = UserAvatar.builder()
			.avatarId(avatarId)
			.userId(userId)
			.avatarName(request.getAvatarName())
			.fileId(savedFile.getFileId().longValue())
			.isActive(DEFAULT_ACTIVE_FLAG)
			.createdBy(userId)
			.updatedBy(userId)
			.build();

		userAvatarRepository.insertAvatar(avatar);
		AvatarResponse response = userAvatarRepository.selectAvatarById(avatarId);
		if (response == null) {
			return AvatarResponse.builder()
				.avatarId(avatarId)
				.userId(userId)
				.avatarName(request.getAvatarName())
				.fileId(savedFile.getFileId().longValue())
				.originalFileName(savedFile.getOriginalName())
				.fileUrl(savedFile.getS3Url())
				.isActive(DEFAULT_ACTIVE_FLAG)
				.build();
		}
		return response;
	}

	@Override
	public List<AvatarResponse> getAvatars(String userId) {
		if (userId == null || userId.isBlank()) {
			return List.of();
		}
		return userAvatarRepository.selectAvatarsByUser(userId);
	}

	@Override
	@Transactional
	public void deleteAvatar(String userId, String avatarId) {
		if (userId == null || userId.isBlank()) {
			throw new IllegalArgumentException("사용자 정보가 올바르지 않습니다.");
		}
		if (avatarId == null || avatarId.isBlank()) {
			throw new IllegalArgumentException("삭제할 아바타 정보를 입력해주세요.");
		}

		int updated = userAvatarRepository.deleteAvatar(avatarId, userId);
		if (updated == 0) {
			throw new IllegalArgumentException("아바타 정보를 찾을 수 없습니다.");
		}
	}
}
