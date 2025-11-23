package com.miracle.coordifit.common.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.common.model.FileInfo;

@Mapper
public interface FileRepository {
	void insertFileInfo(FileInfo fileInfo);

	FileInfo selectFileInfoById(Integer fileId);

	List<FileInfo> selectFileInfosByIds(@Param("fileIds") List<Integer> fileIds);

	List<FileInfo> selectFileInfos();

	void deleteFileById(@Param("fileId") Long fileId);

}
