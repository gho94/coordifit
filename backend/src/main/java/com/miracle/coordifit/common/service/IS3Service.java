package com.miracle.coordifit.common.service;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

public interface IS3Service {
	String uploadFile(MultipartFile file) throws IOException;

	// base64 바이트 업로드용
	String uploadBytes(byte[] bytes, String fileName, String contentType) throws IOException;

	void deleteObject(String key);

}
