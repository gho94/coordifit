package com.miracle.coordifit.calender.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyLook {
	private String dailylookId;
	private String userId;
	private String wearDate;
	private String description;
	private Integer fileId;
	private String canvasJson;
	private String createdAt;
	private String updatedAt;

	public static DailyLook empty() {
		return DailyLook.builder().build();
	}
}
