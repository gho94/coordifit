package com.miracle.coordifit.common.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.common.model.HistoryRecord;

@Mapper
public interface HistoryRepository {

	int insertHistory(@Param("tableName") String tableName, @Param("history") HistoryRecord history);
}
