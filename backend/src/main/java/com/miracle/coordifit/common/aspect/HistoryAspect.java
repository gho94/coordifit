package com.miracle.coordifit.common.aspect;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class HistoryAspect {

	private final Map<String, HistorySaver> historySaverMap;

	public HistoryAspect(List<HistorySaver> historySavers) {
		this.historySaverMap = historySavers.stream()
			.collect(Collectors.toMap(
				HistorySaver::getSupportedEntityType,
				saver -> saver));
		log.info("=== HistoryAspect 초기화 - 등록된 HistorySaver: {} ===", historySaverMap.keySet());
	}

	@AfterReturning(pointcut = "@annotation(saveHistory)", returning = "result")
	public void saveHistory(JoinPoint joinPoint, SaveHistory saveHistory, Object result) {
		try {
			String entityType = saveHistory.entityType();
			String actionType = saveHistory.actionType();

			log.info("=== AOP: 히스토리 저장 시작 - entityType: {}, actionType: {} ===",
				entityType, actionType);

			HistorySaver saver = historySaverMap.get(entityType);
			if (saver == null) {
				log.warn("등록된 HistorySaver가 없습니다: {}", entityType);
				return;
			}

			String userId = getCurrentUserId();

			if (result instanceof List) {
				List<?> list = (List<?>)result;
				log.info("=== AOP: 리스트 감지 - count: {} ===", list.size());
				for (Object item : list) {
					if (item != null) {
						saver.saveHistory(item, actionType, userId);
					}
				}
				log.info("=== AOP: 리스트 히스토리 저장 완료 - count: {} ===", list.size());
			} else {
				saver.saveHistory(result, actionType, userId);
				log.info("=== AOP: 히스토리 저장 완료 - entityType: {}, actionType: {}, actionBy: {} ===",
					entityType, actionType, userId);
			}

		} catch (Exception e) {
			log.error("히스토리 저장 중 오류 발생", e);
		}
	}

	private String getCurrentUserId() {
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.isAuthenticated()) {
				String principal = authentication.getName();
				if (principal != null && !principal.equals("anonymousUser")) {
					return principal;
				}
			}
		} catch (Exception e) {
			log.warn("SecurityContext에서 사용자 정보를 가져올 수 없습니다.", e);
		}
		return "SYSTEM";
	}
}
