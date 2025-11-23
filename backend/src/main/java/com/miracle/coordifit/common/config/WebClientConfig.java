package com.miracle.coordifit.common.config;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;

@Configuration
public class WebClientConfig {
	@Value("${app.google.gemini.base-url}")
	private String baseUrl;
	@Value("${app.google.gemini.timeout-ms}")
	private int timeoutMs;

	@Value("${app.openai.base-url}")
	private String openAiBaseUrl;

	@Value("${app.openai.timeout-ms}")
	private int openAiTimeoutMs;

	@Value("${app.ai.base-url}")
	private String aiBaseUrl;

	@Value("${app.ai.connect-timeout-ms}")
	private int aiTimeoutMs;

	@Bean(name = "geminiWebClient")
	public WebClient geminiWebClient(WebClient.Builder builder) {
		HttpClient httpClient = createHttpClient(timeoutMs);
		return builder.clone()
			.baseUrl(baseUrl)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.exchangeStrategies(defaultExchangeStrategies())
			.build();
	}

	@Bean(name = "openAIWebClient")
	public WebClient openAIWebClient(WebClient.Builder builder) {
		HttpClient httpClient = createHttpClient(openAiTimeoutMs);
		return builder.clone()
			.baseUrl(openAiBaseUrl)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.exchangeStrategies(defaultExchangeStrategies())
			.build();
	}

	@Bean(name = "fastApiWebClient")
	public WebClient fastApiWebClient(WebClient.Builder builder) {
		HttpClient httpClient = createHttpClient(aiTimeoutMs);
		return builder.clone()
			.baseUrl(aiBaseUrl)
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.exchangeStrategies(defaultExchangeStrategies())
			.build();
	}

	private HttpClient createHttpClient(int timeoutMillis) {
		return HttpClient.create()
			.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutMillis)
			.responseTimeout(Duration.ofMinutes(5))
			.doOnConnected(c -> c
				.addHandlerLast(new ReadTimeoutHandler(300, TimeUnit.SECONDS))
				.addHandlerLast(new WriteTimeoutHandler(300, TimeUnit.SECONDS)));
	}

	private ExchangeStrategies defaultExchangeStrategies() {
		return ExchangeStrategies.builder()
			.codecs(cfg -> cfg
				.defaultCodecs()
				.maxInMemorySize(16 * 1024 * 1024))
			.build();
	}
}
