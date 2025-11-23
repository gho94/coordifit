package com.miracle.coordifit.common.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class S3Service implements IS3Service {

	private final S3Client s3Client;

	@Value("${aws.s3.bucket}")
	private String bucket;

	@Value("${aws.s3.region}")
	private String region;

	private String buildPublicUrl(String key) {
		return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
	}

	@Override
	public String uploadFile(MultipartFile file) throws IOException {
		String key = UUID.randomUUID() + "_" + file.getOriginalFilename();

		PutObjectRequest.Builder builder = PutObjectRequest.builder()
			.bucket(bucket)
			.key(key);

		if (file.getContentType() != null) {
			builder.contentType(file.getContentType());
		}

		s3Client.putObject(
			builder.build(),
			RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

		return buildPublicUrl(key);
	}

	@Override
	public String uploadBytes(byte[] bytes, String fileName, String contentType) throws IOException {
		String safeName = (fileName == null || fileName.isBlank()) ? "upload.bin" : fileName;
		String key = UUID.randomUUID() + "_" + safeName;

		PutObjectRequest.Builder builder = PutObjectRequest.builder()
			.bucket(bucket)
			.key(key);

		if (contentType != null && !contentType.isBlank()) {
			builder.contentType(contentType);
		}

		s3Client.putObject(
			builder.build(),
			RequestBody.fromInputStream(new ByteArrayInputStream(bytes), bytes.length));

		return buildPublicUrl(key);
	}

	@Override
	public void deleteObject(String key) {
		DeleteObjectRequest req = DeleteObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.build();
		s3Client.deleteObject(req);
	}
}
