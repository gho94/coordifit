package com.miracle.coordifit.coordi.repository;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.coordi.model.Coordi;
import com.miracle.coordifit.coordi.model.CoordiItem;

@Mapper
public interface CoordiRepository {
	// 전체 코디 조회
	List<Coordi> getAllCoordisByUser(@Param("userId") String userId);

	// 단건 코디 조회
	Optional<Coordi> getCoordiById(String coordiId);

	// 코디 생성
	int insertCoordi(Coordi coordi);

	// 코디 아이템 생성
	int insertCoordiItem(CoordiItem coordiItem);

	// 코디 아이템 삭제
	int deleteCoordiItemsByCoordiId(String coordiId);

	// 코디 업데이트
	int updateCoordiById(Coordi coordi);

	// 코디 삭제
	int deleteCoordiById(String coordiId, String userId);

	// 코디 아이디 생성
	int getNextCoordiSequence();

	int updateAiFileId(
		@Param("coordiId") String coordiId,
		@Param("aiFileId") Integer aiFileId,
		@Param("updatedBy") String updatedBy);

}
