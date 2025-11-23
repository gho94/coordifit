package com.miracle.coordifit.auth.model;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class EmailVerification {
	private String email; // 인증할 이메일
	private String verificationCode; // 인증 코드
	private LocalDateTime createdAt; // 생성 시간
	private LocalDateTime expiresAt; // 만료 시간
	private boolean isVerified; // 인증 완료 여부

	public EmailVerification(String email, String verificationCode) {
		this.email = email;
		this.verificationCode = verificationCode;
		this.createdAt = LocalDateTime.now();
		this.expiresAt = LocalDateTime.now().plusMinutes(10); // 10분 후 만료
		this.isVerified = false;
	}

	public boolean isValidCode(String code) {
		return this.verificationCode.equals(code) &&
			LocalDateTime.now().isBefore(this.expiresAt) &&
			!this.isVerified;
	}

	public boolean isExpired() {
		return LocalDateTime.now().isAfter(this.expiresAt);
	}

	public void markAsVerified() {
		this.isVerified = true;
	}
}
