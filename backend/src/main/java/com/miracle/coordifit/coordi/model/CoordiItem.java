package com.miracle.coordifit.coordi.model;

import java.sql.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoordiItem {
	private String clothesId;
	private String userId;
	private String coordiId;
	private Date createdAt;
	private Date updatedAt;
}
