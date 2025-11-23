package com.miracle.coordifit.common.aspect;

import java.util.Arrays;
import java.util.stream.Collectors;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import com.miracle.coordifit.common.model.CommonCode;
import com.miracle.coordifit.common.service.ICommonCodeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class LoggingAspect {

	private final ICommonCodeService commonCodeService;

	@Around("execution(* com.miracle.coordifit..*Controller.*(..))")
	public Object logMethod(ProceedingJoinPoint joinPoint) throws Throwable {
		if (!isControllerLoggingEnabled()) {
			return joinPoint.proceed();
		}

		MethodSignature signature = (MethodSignature)joinPoint.getSignature();
		String className = joinPoint.getTarget().getClass().getSimpleName();
		String methodName = signature.getMethod().getName();

		String params = formatParameters(joinPoint);
		log.info("[{}] {} 시작 - params: {}", className, methodName, params);

		long startTime = System.currentTimeMillis();
		try {
			Object result = joinPoint.proceed();
			long executionTime = System.currentTimeMillis() - startTime;
			log.info("[{}] {} 완료 - executionTime: {}ms", className, methodName, executionTime);
			return result;
		} catch (Throwable e) {
			throw e;
		}
	}

	@AfterThrowing(pointcut = "execution(* com.miracle.coordifit..*Controller.*(..))", throwing = "exception")
	public void logException(JoinPoint joinPoint, Throwable exception) {
		MethodSignature signature = (MethodSignature)joinPoint.getSignature();
		String className = joinPoint.getTarget().getClass().getSimpleName();
		String methodName = signature.getMethod().getName();
		log.error("[{}] {} 실패 - exception: {} - message: {}", className, methodName,
			exception.getClass().getSimpleName(), exception.getMessage(), exception);
	}

	private String formatParameters(JoinPoint joinPoint) {
		MethodSignature signature = (MethodSignature)joinPoint.getSignature();
		String[] paramNames = signature.getParameterNames();
		Object[] args = joinPoint.getArgs();

		if (paramNames == null || paramNames.length == 0) {
			return "()";
		}

		return Arrays.stream(paramNames)
			.map(name -> {
				int index = Arrays.asList(paramNames).indexOf(name);
				Object value = index < args.length ? args[index] : null;

				if (value == null) {
					return name + "=null";
				}

				if (value instanceof org.springframework.security.core.Authentication) {
					return name + "=Authentication("
						+ ((org.springframework.security.core.Authentication)value).getName() + ")";
				}

				if (value instanceof org.springframework.web.multipart.MultipartFile) {
					return name + "=MultipartFile";
				}

				String lower = name.toLowerCase();
				if (lower.contains("password") || lower.contains("token") || lower.contains("secret")) {
					return name + "=***";
				}

				if (value instanceof java.util.Map<?, ?> map) {
					return map.entrySet().stream()
						.limit(20)
						.map(e -> {
							String key = String.valueOf(e.getKey());
							String lowerKey = key.toLowerCase();
							if (lowerKey.contains("password") || lowerKey.contains("token")
								|| lowerKey.contains("secret")) {
								return key + "=***";
							}
							String str = String.valueOf(e.getValue());
							if (str.length() > 100)
								str = str.substring(0, 100) + "...";
							return key + "=" + str;
						})
						.collect(Collectors.joining(", ", "{", "}"));
				}

				String valueStr = String.valueOf(value);
				if (valueStr.length() > 200) {
					return name + "=" + valueStr.substring(0, 200) + "...";
				}

				return name + "=" + valueStr;
			})
			.collect(Collectors.joining(", ", "(", ")"));
	}

	private boolean isControllerLoggingEnabled() {
		try {
			CommonCode loggingCode = commonCodeService.getCommonCodeByCodeId("C00001");
			if (loggingCode == null) {
				return false;
			}
			return "Y".equalsIgnoreCase(loggingCode.getIsActive());
		} catch (Exception e) {
			log.warn("로깅 토글 확인 실패, 기본값 false 적용", e);
			return false;
		}
	}
}
