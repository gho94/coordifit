package com.miracle.coordifit.fitting.util;

import java.io.InputStream;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.miracle.coordifit.fitting.dto.ImageGenerationRequestDTO;

/**
 * URL → Base64 변환 유틸
 * (한글/특수문자 안전 처리)
 */
public class ImageUtil {

	public static ImageGenerationRequestDTO.InlineData urlToInlineData(String imageUrl) throws Exception {
		if (imageUrl == null || imageUrl.isBlank())
			return null;

		// ✅ 안전 인코딩된 URL로 변환
		String safeUrl = encodeUrlSafe(imageUrl);

		URL url = new URL(safeUrl);
		try (InputStream in = url.openStream()) {
			byte[] bytes = in.readAllBytes();
			String base64 = Base64.getEncoder().encodeToString(bytes);
			return new ImageGenerationRequestDTO.InlineData("image/png", base64);
		}
	}

	/**
	 * ✅ 한글 파일명만 인코딩하고 쿼리 파라미터는 유지
	 */
	private static String encodeUrlSafe(String url) {
		try {
			// 쿼리 파라미터(?, &) 앞부분과 뒷부분 분리
			String[] parts = url.split("\\?", 2);
			String base = parts[0]; // https://.../filename.png
			String query = parts.length > 1 ? "?" + parts[1] : "";

			// 마지막 / 이후 파일명만 인코딩
			int idx = base.lastIndexOf('/');
			if (idx == -1)
				return url;

			String prefix = base.substring(0, idx + 1);
			String filename = base.substring(idx + 1);

			String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8)
				.replace("+", "%20") // 공백 처리
				.replace("%28", "(")
				.replace("%29", ")"); // 괄호 복원

			return prefix + encoded + query; // ✅ 쿼리 유지
		} catch (Exception e) {
			return url;
		}
	}
}
