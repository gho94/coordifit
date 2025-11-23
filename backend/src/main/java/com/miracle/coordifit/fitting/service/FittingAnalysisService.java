package com.miracle.coordifit.fitting.service;

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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miracle.coordifit.fitting.dto.FittingAnalysisErrorCode;
import com.miracle.coordifit.fitting.dto.FittingAnalysisRequest;
import com.miracle.coordifit.fitting.dto.FittingAnalysisResponse;
import com.miracle.coordifit.fitting.dto.FittingAnalysisResponse.DebugInfo;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FittingAnalysisService implements IFittingAnalysisService {

	private static final String MODEL = "gpt-4o-mini";
	private static final int MAX_TOKENS = 240;

	private static final String SYSTEM_PROMPT = "너는 패션 코디 분석가야. 반드시 아래 JSON 스키마로만 출력해.\n설명/접두사 없이 JSON만 응답해.";

	private static final String USER_PROMPT_TEMPLATE = String.join("\n",
		"규칙:",
		"1) title 1줄 (18~26자, 긍정적이고 감각적인 코디 평)",
		"2) contents 3줄 (각 22~30자, 코디의 장점을 객관적으로 분석 — 색감, 실루엣, 분위기 등)",
		"   - 추천/조언보다는 평가/칭찬 중심",
		"   - '~보인다', '~느껴진다', '~연출했다'와 같은 서술어 사용",
		"3) hashtags 2개 (3~6자, # 포함, 분위기나 스타일 표현)",
		"",
		"스키마:",
		"{\"title\":\"string\",\"contents\":[\"string\",\"string\",\"string\"],\"hashtags\":[\"#a\",\"#b\"]}",
		"",
		"참고 힌트(선택): %s");

	private final ObjectMapper objectMapper;
	private final WebClient openAiWebClient;

	@Value("${app.openai.api-key:}")
	private String openAiApiKey;

	// ✅ 명시적으로 openAIWebClient를 주입받음
	public FittingAnalysisService(
		ObjectMapper objectMapper,
		@Qualifier("openAIWebClient") WebClient openAiWebClient) {
		this.objectMapper = objectMapper;
		this.openAiWebClient = openAiWebClient;
	}

	/** 메인 분석 로직 */
	@Override
	public FittingAnalysisResponse analyze(FittingAnalysisRequest request) {
		String imageSource = prepareImageSource(request.getImageBase64());
		String hint = StringUtils.hasText(request.getHint()) ? request.getHint().trim() : "(없음)";
		Map<String, Object> body = buildRequestBody(imageSource, hint);

		Instant start = Instant.now();
		OpenAIResult result = invokeOpenAi(body);
		JsonNode contentNode = parseContentWithRetry(result.content());
		long latencyMs = Duration.between(start, Instant.now()).toMillis();

		String title = extractTitle(contentNode);
		List<String> contents = extractStringArray(contentNode, "contents");
		List<String> hashtags = extractStringArray(contentNode, "hashtags");

		DebugInfo debug = DebugInfo.builder()
			.model(MODEL)
			.promptTokens(result.promptTokens())
			.completionTokens(result.completionTokens())
			.latencyMs(latencyMs)
			.build();

		return FittingAnalysisResponse.builder()
			.title(title)
			.contents(contents)
			.hashtags(hashtags)
			.debug(debug)
			.build();
	}

	// ---------------------- 내부 헬퍼 ----------------------

	private Map<String, Object> buildRequestBody(String imageSource, String hint) {
		Map<String, Object> requestBody = new LinkedHashMap<>();
		requestBody.put("model", MODEL);
		requestBody.put("max_completion_tokens", MAX_TOKENS);
		requestBody.put("messages", buildMessages(imageSource, hint));
		requestBody.put("response_format", buildResponseFormat());
		return requestBody;
	}

	private List<Map<String, Object>> buildMessages(String imageSource, String hint) {
		List<Map<String, Object>> messages = new ArrayList<>();
		messages.add(Map.of(
			"role", "system",
			"content", List.of(Map.of("type", "text", "text", SYSTEM_PROMPT))));

		List<Map<String, Object>> userContent = new ArrayList<>();
		userContent.add(Map.of("type", "text", "text", String.format(USER_PROMPT_TEMPLATE, hint)));
		userContent.add(Map.of("type", "image_url", "image_url", Map.of("url", imageSource)));

		messages.add(Map.of("role", "user", "content", userContent));
		return messages;
	}

	private Map<String, Object> buildResponseFormat() {
		Map<String, Object> schema = new LinkedHashMap<>();
		schema.put("type", "object");

		Map<String, Object> properties = new LinkedHashMap<>();
		properties.put("title", Map.of("type", "string"));

		Map<String, Object> contentsDefinition = new LinkedHashMap<>();
		contentsDefinition.put("type", "array");
		contentsDefinition.put("items", Map.of("type", "string"));
		contentsDefinition.put("minItems", 3);
		contentsDefinition.put("maxItems", 3);
		properties.put("contents", contentsDefinition);

		Map<String, Object> hashtagsDefinition = new LinkedHashMap<>();
		hashtagsDefinition.put("type", "array");
		hashtagsDefinition.put("items", Map.of("type", "string"));
		hashtagsDefinition.put("minItems", 2);
		hashtagsDefinition.put("maxItems", 2);
		properties.put("hashtags", hashtagsDefinition);

		schema.put("properties", properties);
		schema.put("required", List.of("title", "contents", "hashtags"));

		return Map.of(
			"type", "json_schema",
			"json_schema", Map.of(
				"name", "FittingAnalysis",
				"schema", schema));
	}

	private OpenAIResult invokeOpenAi(Map<String, Object> requestBody) {
		if (!StringUtils.hasText(openAiApiKey)) {
			throw new FittingAnalysisFailure(FittingAnalysisErrorCode.INTERNAL_ERROR, "OpenAI API 키가 설정되지 않았습니다.");
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
						.map(body -> new FittingAnalysisFailure(
							FittingAnalysisErrorCode.OPENAI_ERROR,
							"OpenAI API 호출 실패: " + body)))
				.bodyToMono(String.class)
				.block();

			JsonNode root = objectMapper.readTree(response);
			JsonNode choicesNode = root.path("choices");
			if (!choicesNode.isArray() || choicesNode.isEmpty()) {
				throw new FittingAnalysisFailure(FittingAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답에 선택지가 없습니다.");
			}

			JsonNode messageNode = choicesNode.get(0).path("message");
			String content = messageNode.path("content").asText(null);
			if (!StringUtils.hasText(content)) {
				throw new FittingAnalysisFailure(FittingAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답에 콘텐츠가 없습니다.");
			}

			JsonNode usageNode = root.path("usage");
			int promptTokens = usageNode.path("prompt_tokens").asInt(0);
			int completionTokens = usageNode.path("completion_tokens").asInt(0);

			return new OpenAIResult(content, promptTokens, completionTokens);

		} catch (JsonProcessingException e) {
			throw new FittingAnalysisFailure(FittingAnalysisErrorCode.OPENAI_ERROR, "OpenAI 응답 파싱 실패", e);
		} catch (WebClientResponseException e) {
			throw new FittingAnalysisFailure(
				FittingAnalysisErrorCode.OPENAI_ERROR,
				String.format("OpenAI API 호출 실패(status: %d): %s",
					e.getRawStatusCode(), e.getResponseBodyAsString()),
				e);
		} catch (FittingAnalysisFailure e) {
			throw e;
		} catch (Exception e) {
			throw new FittingAnalysisFailure(
				FittingAnalysisErrorCode.OPENAI_ERROR,
				"OpenAI API 호출 중 오류가 발생했습니다.", e);
		}
	}

	private JsonNode parseContentWithRetry(String content) {
		try {
			return objectMapper.readTree(content);
		} catch (JsonProcessingException first) {
			log.warn("OpenAI 응답 JSON 파싱 1차 실패: {}", first.getMessage());
			String sliced = sliceJson(content);
			if (sliced == null) {
				throw new FittingAnalysisFailure(FittingAnalysisErrorCode.PARSE_ERROR,
					"OpenAI 응답을 JSON으로 파싱할 수 없습니다.", first);
			}
			try {
				return objectMapper.readTree(sliced);
			} catch (JsonProcessingException second) {
				log.warn("OpenAI 응답 JSON 파싱 2차 실패: {}", second.getMessage());
				throw new FittingAnalysisFailure(FittingAnalysisErrorCode.PARSE_ERROR,
					"OpenAI 응답을 JSON으로 파싱할 수 없습니다.", second);
			}
		}
	}

	private String sliceJson(String raw) {
		if (!StringUtils.hasText(raw))
			return null;
		int start = raw.indexOf('{');
		int end = raw.lastIndexOf('}');
		if (start == -1 || end == -1 || start >= end)
			return null;
		return raw.substring(start, end + 1);
	}

	private String extractTitle(JsonNode contentNode) {
		String title = contentNode.path("title").asText(null);
		if (!StringUtils.hasText(title)) {
			throw new FittingAnalysisFailure(FittingAnalysisErrorCode.PARSE_ERROR, "title 필드를 확인할 수 없습니다.");
		}
		return title;
	}

	private List<String> extractStringArray(JsonNode contentNode, String fieldName) {
		JsonNode node = contentNode.get(fieldName);
		if (node == null || !node.isArray()) {
			throw new FittingAnalysisFailure(FittingAnalysisErrorCode.PARSE_ERROR,
				String.format("%s 필드를 배열로 확인할 수 없습니다.", fieldName));
		}
		List<String> values = new ArrayList<>();
		node.forEach(n -> values.add(n.asText()));
		return values;
	}

	private String prepareImageSource(String raw) {
		if (!StringUtils.hasText(raw)) {
			throw new FittingAnalysisFailure(FittingAnalysisErrorCode.BAD_REQUEST, "imageBase64는 필수입니다.");
		}
		String trimmed = raw.trim();
		if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
			return trimmed;
		}
		if (trimmed.startsWith("data:image/")) {
			return trimmed;
		}
		return "data:image/jpeg;base64," + trimmed;
	}

	private record OpenAIResult(String content, int promptTokens, int completionTokens) {
	}
}
