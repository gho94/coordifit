package com.miracle.coordifit.common.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 히스토리 자동 저장 어노테이션
 * 
 * 사용 예시:
 * @SaveHistory(entityType = "CLOTHES", actionType = "INSERT")
 * public String createClothes(...) { ... }
 * 
 * @SaveHistory(entityType = "CLOTHES", actionType = "UPDATE")
 * public void updateClothes(String clothesId, ...) { ... }
 * 
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SaveHistory{

	String entityType();

	String actionType();
}
