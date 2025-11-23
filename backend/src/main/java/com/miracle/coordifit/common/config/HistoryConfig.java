package com.miracle.coordifit.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.miracle.coordifit.common.aspect.GenericHistorySaver;
import com.miracle.coordifit.common.aspect.HistorySaver;
import com.miracle.coordifit.common.repository.HistoryRepository;

import lombok.RequiredArgsConstructor;

/**
 * 히스토리 저장을 위한 HistorySaver 설정 클래스
 * 
 * 새로운 엔티티의 히스토리를 저장하려면 이 클래스에 Bean만 추가하면 됩니다.
 * 
 * 테이블명에서 자동으로 entityType을 추출합니다:
 * - "clothes_history" -> entityType = "CLOTHES"
 * - "dailylook_history" -> entityType = "DAILYLOOK"
 */
@Configuration
@RequiredArgsConstructor
public class HistoryConfig {

	private final HistoryRepository historyRepository;

	/**
	 * Clothes 히스토리 저장 Bean
	 */
	@Bean
	public HistorySaver clothesHistorySaver() {
		return new GenericHistorySaver(historyRepository, "clothes_history");
	}

	@Bean
	public HistorySaver coordiHistorySaver() {
		return new GenericHistorySaver(historyRepository, "coordi_history");
	}

	@Bean
	public HistorySaver dailyLookHistorySaver() {
		return new GenericHistorySaver(historyRepository, "dailylooks_history");
	}

	// 새로운 엔티티 히스토리 저장을 추가하려면 여기에 Bean을 추가하세요
	// 예시:
	// @Bean
	// public HistorySaver dailyLookHistorySaver() {
	//     return new GenericHistorySaver(historyRepository, "dailylook_history");
	// }
}
