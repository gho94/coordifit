package com.miracle.coordifit.common.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import net.coobird.thumbnailator.Thumbnails;

import com.miracle.coordifit.common.dto.Base64ImageDto;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.repository.FileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService implements IFileService {
	private final S3Service s3Service;
	private final FileRepository fileRepository;

	@Value("${aws.s3.bucket}")
	private String bucketName;

	@Value("${file.thumbnail.suffix}")
	private String THUMB_SUFFIX;

	private static final Pattern BASE64_ALLOWED_BODY = Pattern.compile("^[A-Za-z0-9+/=]+$");

	/** data: 접두 제거 + 공백/개행 제거 + URL-safe(-,_)→표준(+,/) + 패딩 재계산(최대 2개) + 따옴표 잔재 제거 */
	private static String sanitizeBase64(String dataUrlOrRaw) {
		if (dataUrlOrRaw == null)
			return null;
		String s = dataUrlOrRaw.trim();

		// 따옴표/백틱 잔재 제거
		if ((s.startsWith("\"") && s.endsWith("\"")) ||
			(s.startsWith("'") && s.endsWith("'")) ||
			(s.startsWith("`") && s.endsWith("`"))) {
			s = s.substring(1, s.length() - 1);
		}

		// data URL 접두 제거
		int comma = s.indexOf(',');
		if (s.startsWith("data:") && comma >= 0) {
			s = s.substring(comma + 1);
		}

		// 공백/개행 제거
		s = s.replaceAll("\\s+", "");

		// URL-safe → 표준
		s = s.replace('-', '+').replace('_', '/');

		// 패딩 정규화:
		// 1) 끝의 '=' 전부 제거
		int eqRun = 0;
		for (int i = s.length() - 1; i >= 0 && s.charAt(i) == '='; i--)
			eqRun++;
		if (eqRun > 0)
			s = s.substring(0, s.length() - eqRun);

		// 2) 중간에 '=' 가 끼어있으면 잘못된 문자열
		int midEq = s.indexOf('=');
		if (midEq >= 0) {
			throw new IllegalArgumentException("잘못된 위치의 '='(패딩은 끝에만 허용)");
		}

		// 3) 길이 % 4에 맞춰 정확히 재부착
		int rem = s.length() % 4;
		if (rem == 0) {
			// no-op
		} else if (rem == 2) {
			s = s + "==";
		} else if (rem == 3) {
			s = s + "=";
		} else { // rem == 1 은 정상적인 Base64가 될 수 없음
			throw new IllegalArgumentException("잘못된 Base64 길이(mod 1)");
		}

		return s;
	}

	/** 간이 Content-Type 추정 (시그니처 기반) */
	private static String guessContentType(byte[] bytes, String fallback) {
		if (bytes == null || bytes.length < 4)
			return fallback;
		// PNG: 89 50 4E 47
		if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
			return "image/png";
		}
		// JPG: FF D8
		if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8) {
			return "image/jpeg";
		}
		// GIF: 47 49 46
		if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46) {
			return "image/gif";
		}
		// WEBP: "RIFF....WEBP"
		if (bytes.length >= 12 &&
			bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
			bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
			return "image/webp";
		}
		return (fallback != null && !fallback.isBlank()) ? fallback : "application/octet-stream";
	}

	@Override
	@Transactional
	public FileInfo uploadFile(MultipartFile file) {
		try {
			final String originalUrl = s3Service.uploadFile(file);
			final String originalKey = getFileName(originalUrl);

			FileInfo fileInfo = FileInfo.builder()
				.originalName(file.getOriginalFilename())
				.s3Key(originalKey)
				.s3Url(originalUrl)
				.bucketName(bucketName)
				.fileSize(file.getSize())
				.fileType(file.getContentType())
				.uploadBy(getCurrentUser())
				.build();

			fileRepository.insertFileInfo(fileInfo);
			return fileInfo;

		} catch (IOException e) {
			throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
		}
	}

	@Override
	@Transactional
	public FileInfo uploadFileWithThumbnail(MultipartFile file) {
		try {
			final String originalUrl = s3Service.uploadFile(file);
			final String originalKey = getFileName(originalUrl);

			byte[] thumbBytes = createThumbnailPngBytes(file.getInputStream());
			String thumbKey = addSuffixToFilenName(originalKey, THUMB_SUFFIX);

			MultipartFile thumbFile = new MockMultipartFile(
				thumbKey,
				thumbKey,
				"image/png",
				thumbBytes);

			final String thumbUrl = s3Service.uploadFile(thumbFile);

			FileInfo fileInfo = FileInfo.builder()
				.originalName(file.getOriginalFilename())
				.s3Key(originalKey)
				.s3Url(originalUrl)
				.s3ThumbnailUrl(thumbUrl)
				.bucketName(bucketName)
				.fileSize(file.getSize())
				.fileType(file.getContentType())
				.uploadBy(getCurrentUser())
				.build();

			fileRepository.insertFileInfo(fileInfo);
			return fileInfo;

		} catch (IOException e) {
			throw new RuntimeException("파일 및 썸네일 업로드 중 오류가 발생했습니다.", e);
		}
	}

	@Override
	public FileInfo getFileById(Integer fileId) {
		return fileRepository.selectFileInfoById(fileId);
	}

	@Override
	public Map<Integer, FileInfo> getFilesByIds(List<Integer> fileIds) {
		if (fileIds == null || fileIds.isEmpty()) {
			return Collections.emptyMap();
		}

		List<FileInfo> fileInfos = fileRepository.selectFileInfosByIds(fileIds);

		return fileInfos.stream()
			.collect(Collectors.toMap(FileInfo::getFileId, fileInfo -> fileInfo));
	}

	@Override
	public List<FileInfo> getFiles() {
		return fileRepository.selectFileInfos();
	}

	@Override
	@Transactional
	public FileInfo uploadBase64(Base64ImageDto dto) {
		if (dto == null || dto.getDataUrl() == null || dto.getDataUrl().isBlank()) {
			throw new IllegalArgumentException("dataUrl이 비어 있습니다.");
		}

		log.debug("RAW dataUrl START: {}", dto.getDataUrl().substring(0, Math.min(120, dto.getDataUrl().length())));
		log.debug("RAW dataUrl END: {}", dto.getDataUrl().substring(Math.max(dto.getDataUrl().length() - 120, 0)));

		// prefix 분리
		String dataUrl = dto.getDataUrl().trim();
		String base64Data = dataUrl;
		String contentType = null;

		if (dataUrl.startsWith("data:") && dataUrl.contains(";base64,")) {
			int start = dataUrl.indexOf(":") + 1;
			int end = dataUrl.indexOf(";base64,");
			contentType = dataUrl.substring(start, end); // ex) "image/png"
			base64Data = dataUrl.substring(end + 8); // ex) "iVBORw0KGgoAAAANSUhEUgAA..."
		}

		base64Data = base64Data
			.replaceAll("\n", "")
			.replaceAll("\r", "")
			.replaceAll(" ", "");

		log.debug("CLEAN base64 START: {}", base64Data.substring(0, Math.min(80, base64Data.length())));
		log.debug("CLEAN base64 END: {}", base64Data.substring(Math.max(base64Data.length() - 80, 0)));

		// Base 64 decoding
		byte[] bytes;
		try {
			bytes = Base64.getDecoder().decode(base64Data);
		} catch (IllegalArgumentException e) {
			log.error("❌ Base64 디코딩 실패. 앞 60자 프리뷰={}", base64Data.substring(0, Math.min(60, base64Data.length())));
			throw new RuntimeException("Base64 디코딩 실패: 유효하지 않은 데이터", e);
		}

		// content type 보정
		if (contentType == null || contentType.isBlank()) {
			String guessed = guessContentType(bytes, null);
			contentType = (guessed != null) ? guessed : "image/jpeg";
		}

		// ext mapping
		String ext = switch (contentType) {
			case "image/png" -> ".png";
			case "image/webp" -> ".webp";
			case "image/gif" -> ".gif";
			default -> ".jpg";
		};

		String baseName = "ai-fitting-" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());

		String fileName = baseName + ext;

		try {
			log.info("📤 Base64 업로드 요청: name={}, size={} bytes, type={}", fileName, bytes.length, contentType);

			// s3 image upload
			String url = s3Service.uploadBytes(bytes, fileName, contentType);
			String key = url.substring(url.lastIndexOf('/') + 1);

			FileInfo fileInfo = FileInfo.builder()
				.originalName(fileName)
				.s3Key(key)
				.s3Url(url)
				.bucketName(bucketName)
				.fileSize((long)bytes.length)
				.fileType(contentType)
				.uploadBy(getCurrentUser())
				.build();

			fileRepository.insertFileInfo(fileInfo);
			log.info("✅ Base64 이미지 업로드 성공: {}", url);

			return fileInfo;
		} catch (IOException e) {
			log.error("❌ S3 업로드 실패: {}", e.getMessage(), e);
			throw new RuntimeException("S3 업로드 중 오류가 발생했습니다.", e);
		} catch (IllegalArgumentException e) {
			log.error("❌ Base64 디코딩 실패: {}", e.getMessage(), e);
			throw new RuntimeException("Base64 디코딩에 실패했습니다.", e);
		}
	}

	@Override
	@Transactional
	public void deleteFileById(Long fileId) {
		FileInfo file = fileRepository.selectFileInfoById(fileId.intValue());
		if (file == null)
			return;

		s3Service.deleteObject(file.getS3Key()); // 👈 S3 삭제
		fileRepository.deleteFileById(fileId); // 👈 DB 삭제
	}

	private String getFileName(String url) {
		return url.substring(url.lastIndexOf('/') + 1);
	}

	private String addSuffixToFilenName(String fileName, String suffix) {
		int dotIndex = fileName.lastIndexOf('.');
		if (dotIndex == -1)
			return fileName + suffix;
		String name = fileName.substring(0, dotIndex);
		String ext = fileName.substring(dotIndex);
		return name + suffix + ext;
	}

	private byte[] createThumbnailPngBytes(InputStream input) throws IOException {
		BufferedImage originalImage = ImageIO.read(input);
		BufferedImage thumbnail = Thumbnails.of(originalImage)
			.size(300, 300)
			.keepAspectRatio(true)
			.asBufferedImage();

		try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
			ImageIO.write(thumbnail, "png", baos);
			return baos.toByteArray();
		}
	}

	private String getCurrentUser() {
		try {
			var auth = SecurityContextHolder.getContext().getAuthentication();
			return (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
				? auth.getName()
				: "ADMIN";
		} catch (Exception e) {
			log.debug("getCurrentUser ignored: {}", e.getMessage());
			return "ADMIN";
		}
	}
}
