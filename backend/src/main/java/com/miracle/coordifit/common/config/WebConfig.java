package com.miracle.coordifit.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
	@Value("${app.cors.allowed-origins:}")
	private String allowedOriginCsv;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		String[] origins = org.springframework.util.StringUtils.hasText(allowedOriginCsv)
			? org.springframework.util.StringUtils.commaDelimitedListToStringArray(allowedOriginCsv)
			: new String[0];

		// registry.addMapping("/api/**") prod
		registry.addMapping("/**")
			.allowedOrigins(origins)
			.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
			.allowedHeaders("*")
			.allowCredentials(true)
			.maxAge(3600);
	}
}
