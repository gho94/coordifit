package com.miracle.coordifit.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"password", "newPassword"})
public class AuthRequestDto {

	@NotBlank(message = "이메일은 필수입니다.")
	@Email(message = "올바른 이메일 형식이 아닙니다.")
	private String email;

	@Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
	@Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[@$!%*?&#^])[A-Za-z\\d@$!%*?&#^]+$", message = "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.")
	private String password;

	@Size(min = 8, message = "새 비밀번호는 최소 8자 이상이어야 합니다.")
	@Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[@$!%*?&#^])[A-Za-z\\d@$!%*?&#^]+$", message = "새 비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.")
	private String newPassword;

	@Size(min = 2, max = 50, message = "닉네임은 2자 이상 50자 이하여야 합니다.")
	private String nickname;

	private String verificationCode;
}
