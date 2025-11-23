package com.miracle.coordifit.calender.service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.miracle.coordifit.calender.dto.DailyLookResponse;
import com.miracle.coordifit.calender.dto.DailyLookSummaryResponse;
import com.miracle.coordifit.calender.mapper.DailyLookMapper;
import com.miracle.coordifit.calender.model.DailyLook;
import com.miracle.coordifit.calender.model.DailyLookItem;
import com.miracle.coordifit.calender.model.MostWornClothesDto;
import com.miracle.coordifit.calender.repository.CalenderRepository;
import com.miracle.coordifit.clothes.repository.ClothesRepository;
import com.miracle.coordifit.common.aspect.SaveHistory;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.service.IFileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalenderService implements ICalenderService {
	private final CalenderRepository calenderRepository;
	private final DailyLookMapper dailyLookMapper;
	private final ClothesRepository clothesRepository;
	private final IFileService fileservice;
	private final ObjectMapper objectMapper;

	@Override
	@Transactional
	@SaveHistory(entityType = "DAILYLOOKS", actionType = "DELETE")
	public DailyLook deleteDailyLookByDate(String userId, String wearDate) {

		Optional<DailyLook> existing = calenderRepository.getDailyLookByDate(userId, wearDate);

		if (existing.isEmpty()) {
			log.warn(">> deleteDailyLookByDate 실패: {} 날짜의 데일리룩이 존재하지 않음", wearDate);
			return null;
		}

		DailyLook target = existing.get();

		try {
			if (!LocalDate.parse(target.getWearDate().substring(0, 10)).isAfter(LocalDate.now())) {
				clothesRepository.decreaseWearCountByClothesIds(target.getDailylookId(), userId);
			}
			clothesRepository.updateLastWornDateByDailylookId(target.getDailylookId(), userId);
			int deletedItems = calenderRepository.deleteDailyLookItemsByDailyLookId(target.getDailylookId());
			log.info(">>>>> deleted {} coordi items for {}", deletedItems, target.getDailylookId());
		} catch (Exception e) {
			log.warn(">>>>> DAILYLOOK_ITEMS 삭제 중 예외 발생: {}", e.getMessage());
		}

		try {
			int deleted = calenderRepository.deleteDailyLookById(target.getDailylookId());
			log.info(">> deleteDailyLookByDate 완료: id={}, affectedRows={}", target.getDailylookId(), deleted);
		} catch (Exception e) {
			log.warn(">>>>> DAILYLOOK 삭제 중 예외 발생: {}", e.getMessage());
		}

		return target;
	}

	@Override
	@Transactional
	@SaveHistory(entityType = "DAILYLOOKS", actionType = "INSERT")
	public DailyLook insertDailyLook(String userId, String wearDate, MultipartFile image,
		String description, String itemsJson) {
		FileInfo imageInfo = fileservice.uploadFileWithThumbnail(image);

		DailyLook dailyLook = DailyLook.builder()
			.userId(userId)
			.wearDate(wearDate)
			.description(description)
			.fileId(imageInfo.getFileId())
			.canvasJson(itemsJson)
			.build();

		String dailylookId = generateDailylookId();
		dailyLook.setDailylookId(dailylookId);

		int result = calenderRepository.insertDailyLook(dailyLook);
		log.info(">> insert dailyLook success: {}", result);

		if (dailyLook.getDailylookId() == null) {
			throw new IllegalStateException("dailyLookId가 설정되지 않았습니다.");
		}

		insertDailyLookItem(itemsJson, dailyLook);

		return dailyLook;
	}

	@Override
	@Transactional
	@SaveHistory(entityType = "DAILYLOOKS", actionType = "UPDATE")
	public DailyLook updateDailyLook(String userId, String wearDate, MultipartFile image, String description,
		String itemsJson) {
		Optional<DailyLook> existingOpt = calenderRepository.getDailyLookByDate(userId, wearDate);
		if (existingOpt.isEmpty()) {
			log.warn(">> updateDailyLook 실패: {} 날짜의 데일리룩이 존재하지 않음", wearDate);

			return null;
		}

		DailyLook existing = existingOpt.get();

		FileInfo imageInfo = fileservice.uploadFileWithThumbnail(image);

		DailyLook dailyLook = DailyLook.builder()
			.dailylookId(existing.getDailylookId())
			.userId(userId)
			.wearDate(wearDate)
			.description(description)
			.fileId(imageInfo.getFileId())
			.canvasJson(itemsJson)
			.build();

		int result = calenderRepository.updateDailyLook(dailyLook);
		log.info(">> update dailyLook success: {}", result);

		if (dailyLook.getDailylookId() == null) {
			throw new IllegalStateException("dailyLookId가 설정되지 않았습니다.");
		}

		if (!LocalDate.parse(existing.getWearDate().substring(0, 10)).isAfter(LocalDate.now())) {
			clothesRepository.decreaseWearCountByClothesIds(existing.getDailylookId(), userId);
		}
		clothesRepository.updateLastWornDateByDailylookId(existing.getDailylookId(), userId);
		calenderRepository.deleteDailyLookItemsByDailyLookId(existing.getDailylookId());

		insertDailyLookItem(itemsJson, dailyLook);

		return dailyLook;
	}

	private void insertDailyLookItem(String itemsJson, DailyLook dailyLook) {
		List<DailyLookItem> items = parseItemsJson(itemsJson, dailyLook);

		for (DailyLookItem item : items) {
			calenderRepository.insertDailyLookItem(item);
			if (!LocalDate.parse(item.getWearDate().toString()).isAfter(LocalDate.now())) {
				clothesRepository.increaseWearCountByClothesId(item);
			}
			clothesRepository.updateLastWornDateByClothesId(item);
		}
	}

	@Override
	public List<DailyLookResponse> getDailyLooksByMonth(String userId, String yearMonth) {
		List<DailyLook> dailyLooks = calenderRepository.getDailyLooksByMonth(userId, yearMonth);

		List<Integer> fileIdList = dailyLooks.stream()
			.map(DailyLook::getFileId)
			.filter(Objects::nonNull)
			.toList();

		Map<Integer, FileInfo> thumbMap = fileservice.getFilesByIds(fileIdList);

		return dailyLookMapper.toResponseList(dailyLooks, thumbMap);
	}

	@Override
	public DailyLookResponse getDailyLookByDate(String userId, String wearDate) {
		Optional<DailyLook> optional = calenderRepository.getDailyLookByDate(userId, wearDate);

		if (optional.isEmpty()) {
			return DailyLookResponse.empty();
		}

		DailyLook dailyLook = optional.get();

		log.info("dailyLook : {}", dailyLook.toString());
		Integer imageId = dailyLook.getFileId();

		FileInfo fileInfo = fileservice.getFileById(imageId);
		String originImageUrl = fileInfo.getS3Url();
		String thumbImageUrl = fileInfo.getS3ThumbnailUrl();

		DailyLookResponse response = dailyLookMapper.toResponse(dailyLook, originImageUrl, thumbImageUrl);

		return response;
	}

	@Override
	public DailyLookSummaryResponse getDailyLookSummary(String userId, String yearMonth) {
		int totalCount = calenderRepository.selectDailyLookCountByMonth(userId, yearMonth);
		MostWornClothesDto mostWornClothes = calenderRepository.selectMostWornClothes(userId);
		MostWornClothesDto mostWornClothesByMonth = calenderRepository.selectMostWornClothesByMonth(userId, yearMonth);

		if (mostWornClothes == null)
			mostWornClothes = MostWornClothesDto.empty();
		if (mostWornClothesByMonth == null)
			mostWornClothesByMonth = MostWornClothesDto.empty();

		return DailyLookSummaryResponse.builder()
			.totalDailyLookCount(totalCount)
			.mostWornClothesOverall(mostWornClothes)
			.mostWornClothesThisMonth(mostWornClothesByMonth)
			.build();
	}

	private List<DailyLookItem> parseItemsJson(String itemsJson, DailyLook dailyLook) {
		try {
			List<Map<String, Object>> rawList = objectMapper.readValue(itemsJson,
				new TypeReference<List<Map<String, Object>>>() {});

			return rawList.stream().map(obj -> {
				DailyLookItem item = new DailyLookItem();
				item.setUserId(dailyLook.getUserId());
				item.setDailylookId(dailyLook.getDailylookId());
				item.setWearDate(Date.valueOf(dailyLook.getWearDate()));
				item.setClothesId((String)obj.get("clothesId"));

				return item;
			}).toList();
		} catch (Exception e) {
			throw new RuntimeException("itemsJson 파싱 실패", e);
		}
	}

	private String generateDailylookId() {
		DateTimeFormatter YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
		String date = LocalDate.now().format(YYMMDD);
		int nextSeq = calenderRepository.getNextDailyLookSequence();

		return String.format("D%s%03d", date, nextSeq);
	}
}
