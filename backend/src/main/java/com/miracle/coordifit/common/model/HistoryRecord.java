package com.miracle.coordifit.common.model;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryRecord {

	private LocalDateTime createdAt;
	private String actionType;
	private String actionBy;
	private Map<String, Object> fields;

	public HistoryRecord(Object source, String actionType, String actionBy) {
		this.actionType = actionType;
		this.actionBy = actionBy;
		this.fields = toSnakeCaseFieldMap(source);
	}

	private final Set<String> EXCLUDED_FIELDS = Set.of(
		"createdAt", "updatedAt", "createdBy", "updatedBy");

	private Map<String, Object> toSnakeCaseFieldMap(Object source) {
		Map<String, Object> result = new LinkedHashMap<>();
		if (source == null)
			return result;

		Class<?> type = source.getClass();
		while (type != null && type != Object.class) {
			for (Field field : type.getDeclaredFields()) {
				String name = field.getName();

				if (EXCLUDED_FIELDS.contains(name)) {
					continue;
				}

				try {
					field.setAccessible(true);
					Object value = field.get(source);

					if (value == null) {
						continue;
					}

					String snake = camelToSnake(name);
					result.put(snake, value);
				} catch (Exception e) {
					continue;
				}
			}
			type = type.getSuperclass();
		}

		return result;
	}

	private String camelToSnake(String camel) {
		StringBuilder sb = new StringBuilder(camel.length() + 8);
		for (int i = 0; i < camel.length(); i++) {
			char c = camel.charAt(i);
			if (Character.isUpperCase(c)) {
				sb.append('_').append(Character.toLowerCase(c));
			} else {
				sb.append(c);
			}
		}
		return sb.toString();
	}
}
