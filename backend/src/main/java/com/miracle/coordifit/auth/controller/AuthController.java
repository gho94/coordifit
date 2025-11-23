package com.miracle.coordifit.auth.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.auth.dto.AuthRequestDto;
import com.miracle.coordifit.auth.dto.KakaoUserResponse;
import com.miracle.coordifit.auth.service.IEmailService;
import com.miracle.coordifit.auth.service.IJwtService;
import com.miracle.coordifit.auth.service.IKakaoAuthService;
import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.user.model.User;
import com.miracle.coordifit.user.service.IUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
	private final IUserService userService;
	private final IEmailService emailService;
	private final IJwtService jwtService;
	private final IKakaoAuthService kakaoAuthService;

	@PostMapping("/signup")
	public ResponseEntity<ApiResponseDto<Void>> signUp(
		@Valid @RequestBody AuthRequestDto requestDto) {
		userService.signUp(requestDto);
		return ResponseEntity.ok(ApiResponseDto.success("회원가입이 완료되었습니다."));
	}

	@PostMapping("/send-verification")
	public ResponseEntity<ApiResponseDto<String>> sendVerificationCode(
		@Valid @RequestBody AuthRequestDto requestDto) {
		return sendVerificationCode(requestDto, true);
	}

	@GetMapping("/check-email")
	public ResponseEntity<ApiResponseDto<Boolean>> checkEmailAvailability(
		@RequestParam("email") String email) {

		boolean available = userService.isEmailAvailable(email);
		String message = available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다.";
		return ResponseEntity.ok(ApiResponseDto.success(message, available));
	}

	@GetMapping("/check-nickname")
	public ResponseEntity<ApiResponseDto<Boolean>> checkNicknameAvailability(
		@RequestParam("nickname") String nickname) {

		boolean available = userService.isNicknameAvailable(nickname);
		String message = available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.";
		return ResponseEntity.ok(ApiResponseDto.success(message, available));
	}

	@PostMapping("/login")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> login(
		@RequestBody Map<String, Object> loginRequest) {

		String email = (String)loginRequest.get("email");
		String password = (String)loginRequest.get("password");
		if (email == null || email.trim().isEmpty()) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("이메일을 입력해주세요."));
		}
		if (password == null || password.trim().isEmpty()) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("비밀번호를 입력해주세요."));
		}
		User user = userService.authenticate(email, password);
		if (user == null) {
			return ResponseEntity.status(401).body(ApiResponseDto.error("이메일 또는 비밀번호가 올바르지 않습니다."));
		}
		Map<String, Object> responseData = jwtService.createTokens(user);
		return ResponseEntity.ok(ApiResponseDto.success("로그인이 완료되었습니다.", responseData));
	}

	@PostMapping("/refresh")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> refreshToken(
		@RequestBody Map<String, String> refreshRequest) {

		String refreshToken = refreshRequest.get("refreshToken");
		if (refreshToken == null || refreshToken.trim().isEmpty()) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("리프레시 토큰을 입력해주세요."));
		}
		if (!jwtService.validateToken(refreshToken)) {
			return ResponseEntity.status(401).body(ApiResponseDto.error("유효하지 않은 리프레시 토큰입니다."));
		}
		String userId = jwtService.getUserIdFromToken(refreshToken);
		User user = userService.getUserById(userId);
		if (user == null) {
			return ResponseEntity.status(401).body(ApiResponseDto.error("사용자를 찾을 수 없습니다."));
		}
		Map<String, Object> responseData = jwtService.refreshAccessToken(user);
		return ResponseEntity.ok(ApiResponseDto.success("토큰이 갱신되었습니다.", responseData));
	}

	@PostMapping("/logout")
	public ResponseEntity<ApiResponseDto<Void>> logout(
		@RequestBody String userId) {

		if (userId == null || userId.trim().isEmpty()) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("사용자 ID가 필요합니다."));
		}
		jwtService.deleteAllUserTokens(userId);
		return ResponseEntity.ok(ApiResponseDto.success("로그아웃이 완료되었습니다."));
	}

	@PostMapping("/send-password-reset-code")
	public ResponseEntity<ApiResponseDto<String>> sendPasswordResetCode(
		@Valid @RequestBody AuthRequestDto requestDto) {
		return sendVerificationCode(requestDto, false);
	}

	@PostMapping("/reset-password")
	public ResponseEntity<ApiResponseDto<Void>> resetPassword(
		@Valid @RequestBody AuthRequestDto requestDto) {
		userService.resetPassword(requestDto);
		return ResponseEntity.ok(ApiResponseDto.success("비밀번호가 성공적으로 재설정되었습니다."));
	}

	@PostMapping("/kakao/login")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> kakaoLogin(
		@RequestBody Map<String, String> request) {

		String code = request.get("code");
		String redirectUri = request.get("redirectUri");
		KakaoUserResponse kakaoUserResponse = kakaoAuthService.getKakaoUserInfo(code, redirectUri);
		User user = userService.processKakaoLogin(kakaoUserResponse);
		Map<String, Object> responseData = jwtService.createTokens(user);
		return ResponseEntity.ok(ApiResponseDto.success("카카오 로그인이 완료되었습니다.", responseData));
	}

	private ResponseEntity<ApiResponseDto<Map<String, Object>>> createInactiveUserResponse(String userId) {
		Map<String, Object> responseData = Map.of(
			"isActive", false,
			"message", "비활성화된 계정입니다. 계정을 다시 활성화하시겠습니까?",
			"userId", userId);
		return ResponseEntity.status(403)
			.body(ApiResponseDto.error("비활성화된 계정입니다.", responseData));
	}

	private ResponseEntity<ApiResponseDto<String>> sendVerificationCode(
		AuthRequestDto requestDto,
		boolean isSignUp) {
		boolean emailAvailable = userService.isEmailAvailable(requestDto.getEmail());
		if (isSignUp && !emailAvailable) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("이미 사용 중인 이메일입니다."));
		} else if (!isSignUp && emailAvailable) {
			return ResponseEntity.badRequest().body(ApiResponseDto.error("존재하지 않는 이메일입니다."));
		}
		String verificationCode = emailService.sendVerificationCode(requestDto.getEmail(), isSignUp);
		if (verificationCode == null) {
			return ResponseEntity.internalServerError().body(ApiResponseDto.error("인증 코드 발송에 실패했습니다."));
		}
		return ResponseEntity.ok(ApiResponseDto.success("인증 코드가 발송되었습니다.", verificationCode));
	}
}
