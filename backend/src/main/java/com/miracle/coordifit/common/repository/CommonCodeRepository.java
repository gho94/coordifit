package com.miracle.coordifit.common.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.common.model.CommonCode;

@Mapper
public interface CommonCodeRepository {
	String selectLastCodeId();

	String selectLastCodeIdByHeader(@Param("header") String header);

	List<CommonCode> selectCommonCodes();

	CommonCode selectCommonCodeByCodeId(String codeId);

	int insertCommonCode(CommonCode commonCode);

	int updateCommonCode(CommonCode commonCode);

	int deleteCommonCode(String codeId);

	List<CommonCode> selectCommonCodesByParentCodeId(String parentCodeId);
}
