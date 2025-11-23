package com.miracle.coordifit.common.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileInfo {
	private Integer fileId;
	private String originalName;
	private String s3Key;
	private String s3Url;
	private String s3ThumbnailUrl;
	private String bucketName;
	private Long fileSize;
	private String fileType;
	private String uploadBy;
	private LocalDateTime uploadDate;
}
