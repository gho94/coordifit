package com.miracle.coordifit.common.exception;

import lombok.Getter;

@Getter
public class InactiveUserException extends RuntimeException {
	private final String userId;

	public InactiveUserException(String userId) {
		super("비활성화된 계정입니다.");
		this.userId = userId;
	}
}
