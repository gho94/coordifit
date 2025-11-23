package com.miracle.coordifit.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class SwaggerConfig {

	@Bean
	public OpenAPI coordiFitOpenAPI() {
		return new OpenAPI()
			.info(new Info()
				.title("CoordiFit API")
				.description("CoordiFit 백엔드 API 명세서 (JWT 인증 필요)")
				.version("v1.0.0"))
			// ✅ Swagger에서 “Authorize” 버튼 생김
			.addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
			.components(new Components()
				.addSecuritySchemes("BearerAuth",
					new SecurityScheme()
						.name("Authorization")
						.type(SecurityScheme.Type.HTTP)
						.scheme("bearer")
						.bearerFormat("JWT")
						.in(SecurityScheme.In.HEADER)
						.description("JWT 토큰 입력 (예: Bearer eyJhbGciOi...)")));
	}
}
