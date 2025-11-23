package com.miracle.coordifit.auth.service;

import com.miracle.coordifit.auth.dto.KakaoUserResponse;

public interface IKakaoAuthService {

	KakaoUserResponse getKakaoUserInfo(String code, String redirectUri);
}
