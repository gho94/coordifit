package com.miracle.coordifit.calender.model;

import java.sql.Date;

import lombok.Data;

@Data
public class DailyLookItem {
	private String clothesId;
	private String userId;
	private String dailylookId;
	private Date wearDate;
	private Date createdAt;
}
