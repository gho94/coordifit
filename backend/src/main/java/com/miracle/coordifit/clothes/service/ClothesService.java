package com.miracle.coordifit.clothes.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.miracle.coordifit.calender.repository.CalenderRepository;
import com.miracle.coordifit.clothes.dto.ClothesDetailResponse;
import com.miracle.coordifit.clothes.dto.ClothesRequest;
import com.miracle.coordifit.clothes.dto.ClothesResponse;
import com.miracle.coordifit.clothes.model.Clothes;
import com.miracle.coordifit.clothes.model.ClothesImage;
import com.miracle.coordifit.clothes.repository.ClothesRepository;
import com.miracle.coordifit.common.aspect.SaveHistory;
import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.common.service.BackgroundRemovalService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClothesService implements IClothesService {

	private final ClothesRepository clothesRepository;
	private final BackgroundRemovalService backgroundRemovalService;
	private final CalenderRepository calenderRepository;

	@Override
	@Transactional
	@SaveHistory(entityType = "CLOTHES", actionType = "INSERT")
	public Clothes createClothes(ClothesRequest request, String userId) {
		if (request.getFiles() == null || request.getFiles().isEmpty()) {
			throw new IllegalArgumentException("이미지는 최소 1장 필요합니다.");
		}

		log.info("옷 등록 시작: userId={}, name={}", userId, request.getName());

		String clothesId = generateClothesId();

		Clothes clothes = Clothes.builder()
			.clothesId(clothesId)
			.userId(userId)
			.name(request.getName())
			.brand(request.getBrand())
			.categoryCode(request.getCategoryCode())
			.clothesSize(request.getClothesSize())
			.price(request.getPrice())
			.purchaseDate(request.getPurchaseDate() != null
				? LocalDate.parse(request.getPurchaseDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"))
				: null)
			.purchaseUrl(request.getPurchaseUrl())
			.description(request.getDescription())
			.isActive("Y")
			.createdBy(userId)
			.build();

		clothesRepository.insertClothes(clothes);

		for (MultipartFile file : request.getFiles()) {
			if (file != null && !file.isEmpty()) {
				FileInfo uploadedFile = backgroundRemovalService.removeBackgroundAndUpload(file);

				ClothesImage clothesImage = ClothesImage.builder()
					.clothesId(clothesId)
					.fileId(uploadedFile.getFileId().longValue())
					.createdBy(userId)
					.build();

				int result = clothesRepository.insertClothesImage(clothesImage);
				if (result <= 0) {
					throw new RuntimeException("옷 이미지 등록 처리 중 오류가 발생했습니다.");
				}
			}
		}

		log.info("옷 등록 완료: clothesId={}", clothesId);
		return clothes;
	}

	@Override
	@Transactional
	@SaveHistory(entityType = "CLOTHES", actionType = "UPDATE")
	public Clothes updateClothes(String clothesId, ClothesRequest request, String userId) {
		log.info("옷 수정 시작: clothesId={}, userId={}", clothesId, userId);

		Clothes clothes = Clothes.builder()
			.clothesId(clothesId)
			.name(request.getName())
			.brand(request.getBrand())
			.categoryCode(request.getCategoryCode())
			.clothesSize(request.getClothesSize())
			.price(request.getPrice())
			.purchaseDate(request.getPurchaseDate() != null
				? LocalDate.parse(request.getPurchaseDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"))
				: null)
			.purchaseUrl(request.getPurchaseUrl())
			.description(request.getDescription())
			.updatedBy(userId)
			.build();

		clothesRepository.updateClothes(clothes);

		if (request.getDeletedFileIds() != null && !request.getDeletedFileIds().isEmpty()) {
			for (Long fileId : request.getDeletedFileIds()) {
				try {
					clothesRepository.deleteClothesImage(clothesId, fileId);
					log.info("이미지 삭제 완료: clothesId={}, fileId={}", clothesId, fileId);
				} catch (Exception e) {
					log.warn("이미지 삭제 실패: clothesId={}, fileId={}", clothesId, fileId, e);
				}
			}
		}

		if (request.getFiles() != null && !request.getFiles().isEmpty()) {
			for (MultipartFile file : request.getFiles()) {
				if (file != null && !file.isEmpty()) {
					FileInfo uploadedFile = backgroundRemovalService.removeBackgroundAndUpload(file);

					ClothesImage clothesImage = ClothesImage.builder()
						.clothesId(clothesId)
						.fileId(uploadedFile.getFileId().longValue())
						.createdBy(userId)
						.build();

					clothesRepository.insertClothesImage(clothesImage);
				}
			}
		}

		log.info("옷 수정 완료: clothesId={}", clothesId);
		return clothes;
	}

	@Override
	public List<ClothesResponse> getUserClothes(String userId) {
		log.info("옷 목록 조회: userId={}", userId);

		List<ClothesResponse> clothesList = clothesRepository.selectUserClothes(userId);

		log.info("옷 목록 조회 완료: count={}", clothesList.size());
		return clothesList;
	}

	@Override
	public ClothesDetailResponse getClothesDetail(String clothesId, String userId) {
		log.info("옷 상세 조회: clothesId={}, userId={}", clothesId, userId);

		ClothesDetailResponse clothes = clothesRepository.selectClothesById(clothesId, userId);
		if (clothes == null) {
			throw new IllegalArgumentException("옷 정보를 찾을 수 없습니다.");
		}

		List<ClothesDetailResponse.ClothesImage> images = clothesRepository.selectClothesImage(clothesId);
		clothes.setImages(images);

		log.info("옷 상세 조회 완료: clothesId={}", clothesId);
		return clothes;
	}

	@Override
	@Transactional
	@SaveHistory(entityType = "CLOTHES", actionType = "DELETE")
	public Clothes deleteClothes(String clothesId, String userId) {
		log.info("옷 삭제 시작: clothesId={}, userId={}", clothesId, userId);

		Clothes clothes = Clothes.builder()
			.clothesId(clothesId)
			.updatedBy(userId)
			.build();

		int result = clothesRepository.deleteClothes(clothes);
		if (result <= 0) {
			throw new IllegalArgumentException("옷 정보를 찾을 수 없거나 삭제할 수 없습니다.");
		}

		calenderRepository.deleteDailyLookByClothesId(clothesId, userId);

		log.info("옷 삭제 완료: clothesId={}", clothesId);
		return clothes;
	}

	@Override
	@Transactional
	@SaveHistory(entityType = "CLOTHES", actionType = "DELETE")
	public List<Clothes> bulkDeleteClothes(List<String> clothesIds, String userId) {
		if (clothesIds == null || clothesIds.isEmpty()) {
			throw new IllegalArgumentException("삭제할 옷 ID 목록이 비어있습니다.");
		}

		log.info("옷 일괄 삭제 시작: count={}, userId={}", clothesIds.size(), userId);

		List<Clothes> clothesList = new ArrayList<>();

		for (String clothesId : clothesIds) {
			Clothes clothes = Clothes.builder()
				.clothesId(clothesId)
				.updatedBy(userId)
				.build();

			int result = clothesRepository.deleteClothes(clothes);
			if (result > 0) {
				clothesList.add(clothes);
			} else {
				log.warn("옷 삭제 실패: clothesId={}", clothesId);
			}

			calenderRepository.deleteDailyLookByClothesId(clothesId, userId);
		}

		log.info("옷 일괄 삭제 완료: count={}", clothesList.size());
		return clothesList;
	}

	private String generateClothesId() {
		int nextSeq = clothesRepository.getNextClothesSequence();
		return String.format("C%s%03d", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd")), nextSeq);
	}
}
