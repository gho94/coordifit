package com.miracle.coordifit.coordi.service;

import java.util.List;

import com.miracle.coordifit.coordi.dto.CoordiResponse;
import com.miracle.coordifit.coordi.model.Coordi;

public interface ICoordiService {

	List<CoordiResponse> getAllCoordisByUser(String userId);

	CoordiResponse getCoordiById(String coordiId);

	Coordi insertCoordi(String userId, String canvasJson, String coordiName, String description, int fileId);

	Coordi updateCoordi(String userId, String canvasJson, String coordiName, String description, int fileId,
		String coordiId);

	int updateAiFileId(String coordiId, Integer aiFileId);

	void insertCoordiItem(String canvasJson, Coordi coordi);

	void deleteCoordiItem(String coordiId);

	Coordi deleteCoordi(String coordiId, String userId);

	List<Coordi> deleteCoordis(List<String> coordiIds, String userId);
}
