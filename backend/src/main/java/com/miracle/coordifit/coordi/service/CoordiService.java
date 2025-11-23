package com.miracle.coordifit.coordi.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.apache.ibatis.jdbc.RuntimeSqlException;
import org.springframework.dao.DataAccessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miracle.coordifit.common.aspect.SaveHistory;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.service.IFileService;
import com.miracle.coordifit.coordi.dto.CoordiResponse;
import com.miracle.coordifit.coordi.mapper.CoordiMapper;
import com.miracle.coordifit.coordi.model.Coordi;
import com.miracle.coordifit.coordi.model.CoordiItem;
import com.miracle.coordifit.coordi.repository.CoordiRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoordiService implements ICoordiService {
	private final CoordiMapper coordiMapper;
	private final CoordiRepository coordiRepository;
	private final IFileService fileService;
	private final ObjectMapper objectMapper;

	@Override
	@Transactional
	public List<CoordiResponse> getAllCoordisByUser(String userId) {
		try {
			log.info(">> getAllCoordisByUser called - userId={}", userId);

			if (userId == null || userId.isBlank()) {
				log.warn("⚠️ userId is null or blank");
				throw new IllegalArgumentException("사용자 정보가 유효하지 않습니다.");
			}

			List<Coordi> coordis = coordiRepository.getAllCoordisByUser(userId);
			if (coordis == null || coordis.isEmpty()) {
				log.info(">> No coordis found for userId={}", userId);
				return Collections.emptyList();
			}

			List<Integer> fileIds = coordis.stream()
				.map(Coordi::getFileId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();

			List<Integer> aiFileIds = coordis.stream()
				.map(Coordi::getAiFileId)
				.filter(Objects::nonNull)
				.distinct()
				.toList();

			Map<Integer, FileInfo> fileMap = fileService.getFilesByIds(fileIds);
			Map<Integer, FileInfo> aiFileMap = fileService.getFilesByIds(aiFileIds);

			fileMap.forEach((id, fileInfo) -> log.info("fileMap[{}] = s3Url={}, thumbUrl={}",
				id, fileInfo.getS3Url(), fileInfo.getS3ThumbnailUrl()));

			aiFileMap.forEach((id, fileInfo) -> log.info("aiFileMap[{}] = s3Url={}, thumbUrl={}",
				id, fileInfo.getS3Url(), fileInfo.getS3ThumbnailUrl()));

			List<CoordiResponse> responses = coordiMapper.toReponseList(coordis, fileMap, aiFileMap);

			log.info(">> getAllCoordisByUser success - userId={}, count={}", userId, responses.size());

			return responses;
		} catch (IllegalArgumentException e) {
			// 잘못된 파라미터
			log.warn("Invalid argument in getAllCoordisByUser: {}", e.getMessage());
			throw e; // 그대로 위로 올림 (ControllerAdvice에서 잡히게)
		} catch (DataAccessException e) {
			// DB 관련 예외 (MyBatis, JDBC 등)
			log.error("DB error while fetching coordis for userId={}", userId, e);
			throw new RuntimeException("코디 데이터를 조회하는 중 오류가 발생했습니다.", e);
		} catch (Exception e) {
			// 기타 예외
			log.error("Unexpected error in getAllCoordisByUser for userId={}", userId, e);
			throw new RuntimeException("코디 목록 조회 중 알 수 없는 오류가 발생했습니다.", e);
		}
	};

	@Override
	@Transactional
	public CoordiResponse getCoordiById(String coordiId) {
		Optional<Coordi> optional = coordiRepository.getCoordiById(coordiId);

		if (optional.isEmpty()) {
			return CoordiResponse.empty();
		}

		Coordi coordi = optional.get();
		log.info(">> coordi from getById, {}", coordi);

		Integer fileId = coordi.getFileId();
		Integer aiFileId = coordi.getAiFileId();

		FileInfo imageInfo = null;
		FileInfo aiImageInfo = null;

		if (fileId != null) {
			try {
				imageInfo = fileService.getFileById(fileId);
			} catch (Exception e) {
				log.warn("⚠️ fileId={} 파일 조회 실패: {}", fileId, e.getMessage());
			}
		}

		if (aiFileId != null) {
			try {
				aiImageInfo = fileService.getFileById(aiFileId);
			} catch (Exception e) {
				log.warn("⚠️ aiFileId={} 파일 조회 실패: {}", aiFileId, e.getMessage());
			}
		}

		String originImageUrl = imageInfo != null ? imageInfo.getS3Url() : null;
		String thumbImageUrl = imageInfo != null ? imageInfo.getS3ThumbnailUrl() : null;
		String aiImageUrl = aiImageInfo != null ? aiImageInfo.getS3Url() : null;

		return coordiMapper.toResponse(coordi, originImageUrl, thumbImageUrl, aiImageUrl);
	};

	@Transactional
	@Override
	@SaveHistory(entityType = "COORDI", actionType = "INSERT")
	public Coordi insertCoordi(String userId, String canvasJson, String coordiName, String description, int fileId) {
		Coordi coordi = Coordi.builder()
			.userId(userId)
			.coordiName(coordiName)
			.fileId(fileId)
			.description(description)
			.canvasJson(canvasJson)
			.build();

		String coordiId = generateCoordiId();
		coordi.setCoordiId(coordiId);

		int result = coordiRepository.insertCoordi(coordi);
		log.info(">>>>> [INSERT] coordi Success: {}", result);

		if (coordi.getCoordiId() == null) {
			throw new IllegalStateException("coordiId가 설정되지 않았습니다.");
		}

		insertCoordiItem(canvasJson, coordi);

		return coordi;
	};

	@Transactional
	@Override
	@SaveHistory(entityType = "COORDI", actionType = "UPDATE")
	public Coordi updateCoordi(String userId, String canvasJson, String coordiName, String description, int fileId,
		String coordiId) {
		Optional<Coordi> existingOpt = coordiRepository.getCoordiById(coordiId);

		if (existingOpt.isEmpty()) {
			log.warn(">> updateCoordi 실패: {} 해당 코디가 존재하지 않음", coordiId);

			return null;
		}

		Coordi coordi = Coordi.builder()
			.coordiId(coordiId)
			.userId(userId)
			.coordiName(coordiName)
			.fileId(fileId)
			.description(description)
			.canvasJson(canvasJson)
			.build();

		int result = coordiRepository.updateCoordiById(coordi);
		log.info(">>>>> [UPDATE] coordi success: {}", result);

		if (coordi.getCoordiId() == null) {
			throw new IllegalStateException("coordiId가 설정되지 않았습니다.");
		}

		deleteCoordiItem(coordiId);
		insertCoordiItem(canvasJson, coordi);

		return coordi;
	};

	@Override
	@Transactional
	public int updateAiFileId(String coordiId, Integer aiFileId) {
		if (coordiId == null || coordiId.isBlank()) {
			throw new IllegalArgumentException("coordiId는 필수값입니다.");
		}
		if (aiFileId == null) {
			throw new IllegalArgumentException("aiFileId는 null일 수 없습니다.");
		}

		log.info(">>>>> [UPDATE AI_FILE_ID] coordiId={}, aiFileId={}, updatedBy={}", coordiId, aiFileId,
			getCurrentUserId());
		return coordiRepository.updateAiFileId(coordiId, aiFileId, getCurrentUserId());
	}

	@Override
	public void deleteCoordiItem(String coordiId) {
		coordiRepository.deleteCoordiItemsByCoordiId(coordiId);
	}

	@Override
	@Transactional
	public void insertCoordiItem(String canvasJson, Coordi coordi) {
		List<CoordiItem> itemList = parseCanvasJson(canvasJson, coordi);

		log.info(">> parese Coordi CanvasJson: {}", itemList.toString());

		for (CoordiItem coordiItem : itemList) {
			coordiRepository.insertCoordiItem(coordiItem);
		}
	}

	@Override
	@Transactional
	public Coordi deleteCoordi(String coordiId, String userId) {
		Optional<Coordi> optional = coordiRepository.getCoordiById(coordiId);

		if (optional.isEmpty()) {
			throw new RuntimeException("삭제하려는 코디가 존재하지 않습니다. ID: " + coordiId);
		}

		Coordi coordi = optional.get();
		log.info(">>>>> deleteCoordi - target: {}", coordi.toString());

		try {
			int deletedItems = coordiRepository.deleteCoordiItemsByCoordiId(coordiId);
			log.info(">>>>> deleted {} coordi items for {}", deletedItems, coordiId);
		} catch (Exception e) {
			log.warn(">>>>> LOOK_ITEMS 삭제 중 예외 발생: {}", e.getMessage());
		}

		int deletedCoordi = coordiRepository.deleteCoordiById(coordiId, userId);
		log.info(">>>>> deleted coordi {}, result={}", coordiId, deletedCoordi);

		if (deletedCoordi == 0) {
			throw new RuntimeException("코디 삭제 실패: " + coordiId);
		}

		log.info(">>>>> deleteCoordi 완료: {}", coordiId);

		return coordi;
	}

	@Override
	@Transactional
	public List<Coordi> deleteCoordis(List<String> coordiIds, String userId) {
		if (coordiIds == null || coordiIds.isEmpty()) {
			throw new IllegalArgumentException("삭제할 코디 ID 목록이 비어 있습니다.");
		}

		log.info(">>>>> deleteCoordis - 요청된 ID 개수: {}", coordiIds.size());

		List<Coordi> deletedCoordis = new ArrayList<>();

		for (String coordiId : coordiIds) {
			try {
				Coordi deletedCoordi = deleteCoordi(coordiId, userId); // 기존 단일 삭제 메서드 재사용

				if (deletedCoordi != null) {
					deletedCoordis.add(deletedCoordi);
					log.debug(">>>>> 삭제 성공: {}", coordiId);
				} else {
					log.warn(">>>>> 삭제된 Coordi가 null입니다. (coordiId={})", coordiId);
				}
			} catch (Exception e) {
				log.error(">>>>> deleteCoordi 실패 (coordiId={}): {}", coordiId, e.getMessage());
			}
		}

		log.info(">>>>> deleteCoordis 완료 - 총 {}개 요청 처리", coordiIds.size());
		return deletedCoordis;
	}

	private List<CoordiItem> parseCanvasJson(String canvasJson, Coordi coordi) {
		try {
			List<Map<String, Object>> rawList = objectMapper.readValue(canvasJson,
				new TypeReference<List<Map<String, Object>>>() {});

			return rawList.stream().map(object -> {
				CoordiItem coordiItem = new CoordiItem();

				coordiItem.setUserId(coordi.getUserId());
				coordiItem.setCoordiId(coordi.getCoordiId());
				coordiItem.setUserId(coordi.getUserId());
				coordiItem.setClothesId((String)object.get("clothesId"));

				return coordiItem;
			}).toList();
		} catch (Exception e) {
			throw new RuntimeSqlException("canvasItems 파싱 실패", e);
		}
	}

	private String getCurrentUserId() {
		try {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication != null && authentication.isAuthenticated()) {
				String principal = authentication.getName();
				if (principal != null && !principal.equals("anonymousUser")) {
					return principal;
				}
			}
		} catch (Exception e) {
			log.warn("SecurityContext에서 사용자 정보를 가져올 수 없습니다.", e);
		}
		return "ADMIN";
	}

	private String generateCoordiId() {
		DateTimeFormatter YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
		String date = LocalDate.now().format(YYMMDD);
		int nextSeq = coordiRepository.getNextCoordiSequence();

		return String.format("L%s%03d", date, nextSeq);
	}
}
