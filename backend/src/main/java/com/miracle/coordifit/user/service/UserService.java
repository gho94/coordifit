package com.miracle.coordifit.user.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miracle.coordifit.auth.dto.AuthRequestDto;
import com.miracle.coordifit.auth.dto.KakaoUserResponse;
import com.miracle.coordifit.auth.service.IEmailService;
import com.miracle.coordifit.common.exception.InactiveUserException;
import com.miracle.coordifit.common.service.IFileService;
import com.miracle.coordifit.post.dto.PostDto;
import com.miracle.coordifit.post.repository.PostRepository;
import com.miracle.coordifit.user.dto.MyPageResponseDto;
import com.miracle.coordifit.user.dto.ProfileUpdateRequestDto;
import com.miracle.coordifit.user.model.User;
import com.miracle.coordifit.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService implements IUserService {
	private final UserRepository userRepository;
	private final PostRepository postRepository;
	private final IEmailService emailService;
	private final PasswordEncoder passwordEncoder;
	private final IFileService fileService;

	@Override
	public void signUp(AuthRequestDto signUpRequestDto) {
		log.info("회원가입 시작: {}", signUpRequestDto.getEmail());

		if (!isEmailAvailable(signUpRequestDto.getEmail())) {
			throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
		}

		if (!isNicknameAvailable(signUpRequestDto.getNickname())) {
			throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
		}

		if (!emailService.verifyCode(signUpRequestDto.getEmail(), signUpRequestDto.getVerificationCode())) {
			throw new IllegalArgumentException("이메일 인증 코드가 올바르지 않습니다.");
		}

		String userId = generateUserId();
		String password = passwordEncoder.encode(signUpRequestDto.getPassword());

		User user = User.builder()
			.userId(userId)
			.email(signUpRequestDto.getEmail())
			.password(password)
			.nickname(signUpRequestDto.getNickname())
			.loginTypeCode("A20001") // 이메일 로그인
			.isActive("Y")
			.createdBy(userId)
			.build();

		int result = userRepository.insertUser(user);
		if (result <= 0) {
			throw new RuntimeException("회원가입 처리 중 오류가 발생했습니다.");
		}

		log.info("회원가입 완료: {} -> {}", signUpRequestDto.getEmail(), userId);
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isEmailAvailable(String email) {
		User user = userRepository.selectUser(User.builder().email(email).build());
		return user == null;
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isNicknameAvailable(String nickname) {
		User user = userRepository.selectUser(User.builder().nickname(nickname).build());
		return user == null;
	}

	@Override
	public boolean updateLastLoginTime(String userId) {
		User user = User.builder()
			.userId(userId)
			.loginedAt(java.time.LocalDateTime.now())
			.build();
		int result = userRepository.updateUser(user);
		return result > 0;
	}

	@Override
	@Transactional(readOnly = true)
	public User authenticate(String email, String password) {
		try {
			User user = userRepository.selectUser(User.builder().email(email).build());

			if (user != null && passwordEncoder.matches(password, user.getPassword())) {

				if ("N".equals(user.getIsActive())) {
					throw new InactiveUserException(user.getUserId());
				}

				updateLastLoginTime(user.getUserId());
				return user;
			}

			return null;

		} catch (InactiveUserException e) {
			log.warn("비활성화된 계정 로그인 시도: userId={}", e.getUserId());
			throw e;

		} catch (Exception e) {
			log.error("사용자 인증 중 오류 발생", e);
			throw new RuntimeException("인증 처리 중 오류가 발생했습니다.");
		}
	}

	@Override
	@Transactional(readOnly = true)
	public User getUserById(String userId) {
		try {
			return userRepository.selectUser(User.builder().userId(userId).build());
		} catch (Exception e) {
			log.error("사용자 조회 중 오류 발생: userId={}", userId, e);
			throw new RuntimeException("사용자 조회 중 오류가 발생했습니다.", e);
		}
	}

	@Override
	@Transactional
	public User updateUserProfile(String userId, ProfileUpdateRequestDto requestDto) {
		try {
			User existingUser = userRepository.selectUser(User.builder().userId(userId).build());
			if (existingUser == null) {
				throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
			}

			if (requestDto.getNickname() != null &&
				!requestDto.getNickname().equals(existingUser.getNickname()) &&
				!isNicknameAvailable(requestDto.getNickname())) {
				throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
			}

			Long fileId = existingUser.getFileId();

			if (requestDto.getFile() != null && !requestDto.getFile().isEmpty()) {
				fileId = fileService.uploadFile(requestDto.getFile()).getFileId().longValue();
			}

			User updatedUser = User.builder()
				.userId(userId)
				.nickname(requestDto.getNickname())
				.genderCode(requestDto.getGenderCode())
				.birthDate(requestDto.getBirthDate() != null ? LocalDate
					.parse(requestDto.getBirthDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd")).atStartOfDay()
					: null)
				.isActive(requestDto.getIsActive())
				.fileId(fileId)
				.updatedBy(userId)
				.build();

			int result = userRepository.updateUser(updatedUser);
			if (result <= 0) {
				throw new RuntimeException("프로필 업데이트 처리 중 오류가 발생했습니다.");
			}

			return userRepository.selectUser(User.builder().userId(userId).build());
		} catch (Exception e) {
			log.error("프로필 업데이트 중 오류 발생: userId={}", userId, e);
			throw e;
		}
	}

	@Override
	public void toggleUserActive(String userId) {
		try {
			User existingUser = userRepository.selectUser(User.builder().userId(userId).build());
			if (existingUser == null) {
				throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
			}

			User toggledUser = User.builder()
				.userId(userId)
				.isActive(existingUser.getIsActive().equals("Y") ? "N" : "Y")
				.updatedBy(userId)
				.build();

			int result = userRepository.updateUser(toggledUser);
			if (result <= 0) {
				throw new RuntimeException("계정 활성/비활성 처리 중 오류가 발생했습니다.");
			}

			log.info("계정 활성/비활성 완료: userId={}", userId);
		} catch (Exception e) {
			log.error("계정 활성/비활성 중 오류 발생: userId={}", userId, e);
			throw e;
		}
	}

	@Override
	public void resetPassword(AuthRequestDto requestDto) {
		log.info("비밀번호 재설정 시작: {}", requestDto.getEmail());

		try {
			User user = userRepository.selectUser(User.builder().email(requestDto.getEmail()).build());
			if (user == null) {
				throw new IllegalArgumentException("존재하지 않는 이메일입니다.");
			}

			if (!emailService.verifyCode(requestDto.getEmail(), requestDto.getVerificationCode())) {
				throw new IllegalArgumentException("인증 코드가 올바르지 않습니다.");
			}

			String encodedPassword = passwordEncoder.encode(requestDto.getNewPassword());

			User updateUser = User.builder()
				.email(requestDto.getEmail())
				.password(encodedPassword)
				.build();

			int result = userRepository.updateUser(updateUser);
			if (result <= 0) {
				throw new RuntimeException("비밀번호 재설정 처리 중 오류가 발생했습니다.");
			}

			log.info("비밀번호 재설정 완료: {}", requestDto.getEmail());

		} catch (Exception e) {
			log.error("비밀번호 재설정 중 오류 발생: email={}", requestDto.getEmail(), e);
			throw e;
		}
	}

	@Override
	@Transactional(readOnly = true)
	public MyPageResponseDto getMyPageInfo(String userId, String currentUserId) {
		MyPageResponseDto myPageInfo = userRepository.getMyPageInfo(userId);
		if (myPageInfo == null) {
			throw new RuntimeException("사용자 정보를 찾을 수 없습니다: " + userId);
		}

		boolean isPublic = userId.equals(currentUserId);
		List<PostDto> posts = postRepository.getUserPosts(userId, isPublic);
		myPageInfo.setPostsCount(posts.size());
		myPageInfo.setPosts(posts);

		if (isPublic) {
			List<PostDto> likedPosts = postRepository.getUserLikedPosts(userId);
			myPageInfo.setLikedPosts(likedPosts);
		}

		return myPageInfo;
	}

	@Override
	public User processKakaoLogin(KakaoUserResponse kakaoUserResponse) {
		String kakaoId = String.valueOf(kakaoUserResponse.getId());
		String email = kakaoUserResponse.getKakaoAccount().getEmail();

		log.info("카카오 로그인 처리: kakaoId={}, email={}", kakaoId, email);

		try {
			User user = userRepository.selectUser(User.builder().kakaoId(kakaoId).build());

			if (user != null) {
				if ("N".equals(user.getIsActive())) {
					throw new InactiveUserException(user.getUserId());
				}

				updateLastLoginTime(user.getUserId());
				return user;
			}

			User existingUser = userRepository.selectUser(User.builder().email(email).build());

			if (existingUser != null) {
				return linkKakaoUser(existingUser.getUserId(), kakaoId);
			}

			return createKakaoUser(kakaoUserResponse);

		} catch (InactiveUserException e) {
			log.warn("비활성화된 카카오 계정 로그인 시도: userId={}", e.getUserId());
			throw e;
		} catch (Exception e) {
			log.error("카카오 로그인 처리 중 오류 발생: kakaoId={}", kakaoId, e);
			throw new RuntimeException("카카오 로그인 처리 중 오류가 발생했습니다.");
		}
	}

	private User linkKakaoUser(String userId, String kakaoId) {
		User user = User.builder()
			.userId(userId)
			.kakaoId(kakaoId)
			.updatedBy(userId)
			.build();

		int result = userRepository.updateUser(user);
		if (result <= 0) {
			throw new RuntimeException("카카오 정보 연결 중 오류가 발생했습니다.");
		}

		updateLastLoginTime(userId);
		return userRepository.selectUser(User.builder().userId(userId).build());
	}

	private User createKakaoUser(KakaoUserResponse kakaoUserResponse) {
		try {
			String userId = generateUserId();

			User user = User.builder()
				.userId(userId)
				.email(kakaoUserResponse.getKakaoAccount().getEmail())
				.kakaoId(String.valueOf(kakaoUserResponse.getId()))
				.nickname(kakaoUserResponse.getKakaoAccount().getProfile().getNickname())
				.loginTypeCode("A20002")
				.isActive("Y")
				.createdBy(userId)
				.build();

			int result = userRepository.insertUser(user);
			if (result <= 0) {
				throw new RuntimeException("카카오 사용자 생성 중 오류가 발생했습니다.");
			}

			log.info("카카오 사용자 생성 완료: userId={}", userId);

			return user;
		} catch (Exception e) {
			log.error("카카오 사용자 생성 중 오류 발생: kakaoUserResponse={}", kakaoUserResponse, e);
			throw new RuntimeException("카카오 사용자 생성 중 오류가 발생했습니다.", e);
		}
	}

	private String generateUserId() {
		int nextSeq = userRepository.getNextUserSequence();
		return String.format("U%06d", nextSeq);
	}
}
