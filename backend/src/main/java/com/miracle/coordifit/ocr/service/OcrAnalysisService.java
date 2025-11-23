package com.miracle.coordifit.ocr.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miracle.coordifit.ocr.dto.OcrAnalysisErrorCode;
import com.miracle.coordifit.ocr.dto.OcrAnalysisRequest;
import com.miracle.coordifit.ocr.dto.OcrAnalysisResponse;
import com.miracle.coordifit.ocr.dto.OcrAnalysisResponse.DebugInfo;
import com.miracle.coordifit.ocr.dto.OcrAnalysisResponse.ProductInfo;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class OcrAnalysisService implements IOcrAnalysisService {

	private static final String MODEL = "gpt-4o-mini";
	private static final int MAX_TOKENS = 1000;

	private static final String SYSTEM_PROMPT = "당신은 OCR 결과를 분석하여 상품 정보를 JSON으로 정리하는 AI입니다. 반드시 JSON 배열만 응답하세요.";

	private final ObjectMapper objectMapper;
	private final WebClient openAiWebClient;

	@Value("${app.openai.api-key:}")
	private String openAiApiKey;

	public OcrAnalysisService(
		ObjectMapper objectMapper,
		@Qualifier("openAIWebClient") WebClient openAiWebClient) {
		this.objectMapper = objectMapper;
		this.openAiWebClient = openAiWebClient;
	}

	@Override
	public OcrAnalysisResponse analyze(OcrAnalysisRequest request) {
		Instant start = Instant.now();

		log.info("OCR 분석 시작 - results 개수: {}",
			request.getOcrResult() != null && request.getOcrResult().getResults() != null
				? request.getOcrResult().getResults().size() : 0);

		// OCR 결과를 JSON 문자열로 변환
		String ocrJson = convertOcrResultToJson(request.getOcrResult());

		// ChatGPT로 상품 정보 분석
		String prompt = buildPrompt(ocrJson, request.getHint());
		log.info("생성된 프롬프트 길이: {}", prompt.length());

		Map<String, Object> body = buildRequestBody(prompt);
		OpenAIResult result = invokeOpenAi(body);

		log.info("ChatGPT 응답: {}", result.content());

		// 응답 파싱
		List<ProductInfo> products = parseProductsFromContent(result.content());
		log.info("파싱된 상품 개수: {}", products.size());

		long latencyMs = Duration.between(start, Instant.now()).toMillis();

		DebugInfo debug = DebugInfo.builder()
			.model(MODEL)
			.promptTokens(result.promptTokens())
			.completionTokens(result.completionTokens())
			.latencyMs(latencyMs)
			.ocrResultCount(request.getOcrResult() != null && request.getOcrResult().getResults() != null
				? request.getOcrResult().getResults().size() : 0)
			.build();

		return OcrAnalysisResponse.builder()
			.products(products)
			.debug(debug)
			.build();
	}

	private String buildPrompt(String ocrJson, String hint) {
		String hintText = StringUtils.hasText(hint) ? hint.trim() : "없음";

		return """
			다음은 EasyOCR로 추출한 주문내역 이미지의 텍스트 리스트입니다.
			이 리스트를 분석하여 각 상품의 정보를 분리하고 JSON 배열로 정리하세요.

			입력 데이터:
			%s

			힌트(참고사항): %s

			분석 방법:
			1. 브랜드명(던스트, 데꼬로소, 모델아르더 등)을 기준으로 상품을 구분합니다.
			2. 각 브랜드 뒤에 나오는 상품명, 사이즈, 가격, 날짜를 매칭합니다.
			3. 동일한 날짜에 여러 상품이 있을 수 있으므로 주의깊게 분리합니다.

			출력 형식(JSON 배열):
			[
			  {
			    "brand": "던스트",
			    "name": "SUMMER HOLIDAY T-SHIRT LIGHT MELANGE GREY",
			    "size": "OXL",
			    "price": 39986,
			    "purchaseDate": "2024-04-26"
			  },
			  {
			    "brand": "데꼬로소",
			    "name": "컴포트 데이 세미오버 서즈 [라이트 퍼플]",
			    "size": "Size-02",
			    "price": 55336,
			    "purchaseDate": "2024-04-26"
			  },
			  {
			    "brand": "모델아르더",
			    "name": "이지 루즈 데님 팬즈 (진청)",
			    "size": "32",
			    "price": 78716,
			    "purchaseDate": "2024-04-26"
			  }
			]

			규칙:
			1. 반드시 위 예시 형식의 JSON 배열만 반환합니다. 추가 텍스트나 설명은 포함하지 마세요.
			2. 각 브랜드별로 별도의 상품 객체를 생성합니다.
			3. 브랜드명: "던스트", "데꼬로소", "모델아르더" 등 한글/영문 브랜드명
			4. 상품명: 브랜드 다음에 나오는 제품명 (괄호, 밑줄, 코드 포함 가능)
			5. 사이즈: "OXL", "Size-02", "32" 등에서 사이즈만 추출 ("/ 1개" 제거)
			6. 가격: "39,986원" → 39986 (쉼표와 "원" 제거)
			7. 날짜: "24.04.26(금)" → "2024-04-26" 형식으로 변환
			8. 확실하지 않은 값은 null로 설정합니다.
			9. "취소", "배송 조회", "재구매" 등은 상품 정보가 아니므로 무시합니다.
			""".formatted(ocrJson, hintText);
	}

	private Map<String, Object> buildRequestBody(String prompt) {
		Map<String, Object> requestBody = new LinkedHashMap<>();
		requestBody.put("model", MODEL);
		requestBody.put("max_completion_tokens", MAX_TOKENS);
		requestBody.put("messages", buildMessages(prompt));
		return requestBody;
	}

	private List<Map<String, Object>> buildMessages(String prompt) {
		List<Map<String, Object>> messages = new ArrayList<>();
		messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
		messages.add(Map.of("role", "user", "content", prompt));
		return messages;
	}

	private OpenAIResult invokeOpenAi(Map<String, Object> requestBody) {
		if (!StringUtils.hasText(openAiApiKey)) {
			throw new OcrAnalysisFailure(OcrAnalysisErrorCode.INTERNAL_ERROR, "OpenAI API 키가 설정되지 않았습니다.");
		}

		try {
			String response = openAiWebClient.post()
				.uri("/v1/chat/completions")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiApiKey.trim())
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.bodyValue(requestBody)
				.retrieve()
				.onStatus(status -> status.isError(),
					clientResponse -> clientResponse.bodyToMono(String.class)
						.defaultIfEmpty("")
						.map(body -> new OcrAnalysisFailure(
							OcrAnalysisErrorCode.OPENAI_ERROR,
							"OpenAI API 호출 실패: " + body)))
				.bodyToMono(String.class)
				.block();

			JsonNode root = objectMapper.readTree(response);
			JsonNode choicesNode = root.path("choices");
			if (!choicesNode.isArray() || choicesNode.isEmpty()) {
				throw new OcrAnalysisFailure(OcrAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답에 선택지가 없습니다.");
			}

			JsonNode messageNode = choicesNode.get(0).path("message");
			String content = messageNode.path("content").asText(null);
			if (!StringUtils.hasText(content)) {
				throw new OcrAnalysisFailure(OcrAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답에 콘텐츠가 없습니다.");
			}

			JsonNode usageNode = root.path("usage");
			int promptTokens = usageNode.path("prompt_tokens").asInt(0);
			int completionTokens = usageNode.path("completion_tokens").asInt(0);

			return new OpenAIResult(content, promptTokens, completionTokens);

		} catch (JsonProcessingException e) {
			throw new OcrAnalysisFailure(OcrAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답 파싱 실패", e);
		} catch (WebClientResponseException e) {
			throw new OcrAnalysisFailure(
				OcrAnalysisErrorCode.OPENAI_ERROR,
				String.format("OpenAI API 호출 실패(status: %d): %s",
					e.getStatusCode().value(), e.getResponseBodyAsString()),
				e);
		} catch (OcrAnalysisFailure e) {
			throw e;
		} catch (Exception e) {
			throw new OcrAnalysisFailure(
				OcrAnalysisErrorCode.OPENAI_ERROR,
				"OpenAI API 호출 중 오류가 발생했습니다.", e);
		}
	}

	private List<ProductInfo> parseProductsFromContent(String content) {
		try {
			log.info("파싱할 ChatGPT 원본 응답: '{}'", content);
			String cleanContent = content.trim();

			// JSON 배열 부분만 추출
			if (!cleanContent.startsWith("[")) {
				int start = cleanContent.indexOf('[');
				int end = cleanContent.lastIndexOf(']');
				log.info("JSON 배열 추출 - start: {}, end: {}", start, end);
				if (start != -1 && end != -1 && start < end) {
					cleanContent = cleanContent.substring(start, end + 1);
					log.info("추출된 JSON: '{}'", cleanContent);
				} else {
					log.warn("JSON 배열을 찾을 수 없음");
					return new ArrayList<>();
				}
			}

			List<Map<String, Object>> productMaps = objectMapper.readValue(
				cleanContent, new TypeReference<List<Map<String, Object>>>() {});

			log.info("JSON 파싱 성공 - 상품 개수: {}", productMaps.size());

			List<ProductInfo> products = new ArrayList<>();
			for (Map<String, Object> productMap : productMaps) {
				ProductInfo product = ProductInfo.builder()
					.brand(getStringValue(productMap, "brand"))
					.name(getStringValue(productMap, "name"))
					.size(getStringValue(productMap, "size"))
					.price(getIntegerValue(productMap, "price"))
					.purchaseDate(getStringValue(productMap, "purchaseDate"))
					.build();
				products.add(product);
				log.info("상품 추가: {}", product.getBrand());
			}

			return products;

		} catch (JsonProcessingException e) {
			log.error("상품 정보 JSON 파싱 실패: {}", e.getMessage());
			throw new OcrAnalysisFailure(OcrAnalysisErrorCode.PARSE_ERROR,
				"상품 정보 파싱 실패: " + e.getMessage(), e);
		}
	}

	private String getStringValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		return value != null ? value.toString() : null;
	}

	private Integer getIntegerValue(Map<String, Object> map, String key) {
		Object value = map.get(key);
		if (value == null)
			return null;
		if (value instanceof Number) {
			return ((Number)value).intValue();
		}
		try {
			return Integer.parseInt(value.toString());
		} catch (NumberFormatException e) {
			return null;
		}
	}

	private String convertOcrResultToJson(OcrAnalysisRequest.OcrResult ocrResult) {
		try {
			return objectMapper.writeValueAsString(ocrResult);
		} catch (Exception e) {
			log.error("OCR 결과 JSON 변환 실패: {}", e.getMessage());
			return "{}";
		}
	}

	private record OpenAIResult(String content, int promptTokens, int completionTokens) {
	}
}
