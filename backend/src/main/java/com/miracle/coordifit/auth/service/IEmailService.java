package com.miracle.coordifit.auth.service;

public interface IEmailService {
	String sendVerificationCode(String email, boolean isSignUp);

	boolean verifyCode(String email, String code);
}
