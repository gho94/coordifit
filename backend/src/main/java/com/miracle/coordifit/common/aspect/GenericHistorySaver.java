package com.miracle.coordifit.common.aspect;

import com.miracle.coordifit.common.model.HistoryRecord;
import com.miracle.coordifit.common.repository.HistoryRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GenericHistorySaver implements HistorySaver {

	private final HistoryRepository historyRepository;
	private final String tableName;
	private final String entityType;

	/**
	 * @param historyRepository 히스토리 저장소
	 * @param tableName 히스토리 테이블명 (예: "clothes_history", "dailylook_history")
	 */
	public GenericHistorySaver(
		HistoryRepository historyRepository,
		String tableName) {
		this.historyRepository = historyRepository;
		this.tableName = tableName;
		this.entityType = extractEntityType(tableName);
	}

	/**
	 * 테이블명에서 엔티티 타입을 추출
	 * 예: "clothes_history" -> "CLOTHES", "dailylook_history" -> "DAILYLOOK"
	 */
	private String extractEntityType(String tableName) {
		if (tableName == null) {
			return "UNKNOWN";
		}

		String name = tableName;
		// "_history" 제거
		if (name.endsWith("_history")) {
			name = name.substring(0, name.length() - 8);
		}

		// 대문자로 변환
		return name.toUpperCase();
	}

	@Override
	public void saveHistory(Object result, String actionType, String actionBy) {
		try {
			if (result == null) {
				log.error("result가 null입니다. 히스토리 저장을 건너뜁니다.");
				return;
			}

			log.info("{} 히스토리 저장 시작 - tableName: {}, actionType: {}",
				entityType, tableName, actionType);

			HistoryRecord history = new HistoryRecord(result, actionType, actionBy);

			int saveResult = historyRepository.insertHistory(tableName, history);

			if (saveResult > 0) {
				log.info("{} 히스토리 저장 완료 - actionType: {}", entityType, actionType);
			} else {
				log.warn("{} 히스토리 저장 실패", entityType);
			}

		} catch (Exception e) {
			log.error("{} 히스토리 저장 중 오류", entityType, e);
		}
	}

	@Override
	public String getSupportedEntityType() {
		return entityType;
	}
}
