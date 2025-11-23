package com.miracle.coordifit.coordi.mapper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.miracle.coordifit.common.model.FileInfo;
import com.miracle.coordifit.coordi.dto.CoordiResponse;
import com.miracle.coordifit.coordi.model.Coordi;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CoordiMapper {

	public CoordiResponse toResponse(Coordi coordi, String originImageUrl, String thumbImageUrl, String aiImageUrl) {
		if (coordi == null)
			return null;

		return CoordiResponse.builder()
			.coordiId(coordi.getCoordiId())
			.userId(coordi.getUserId())
			.coordiName(coordi.getCoordiName())
			.description(coordi.getDescription())
			.canvasJson(coordi.getCanvasJson())
			.originImageUrl(originImageUrl)
			.thumbImageUrl(thumbImageUrl)
			.aiImageUrl(aiImageUrl)
			.build();
	}

	public List<CoordiResponse> toReponseList(
		List<Coordi> coordis,
		Map<Integer, FileInfo> fileMap,
		Map<Integer, FileInfo> aiFileMap) {
		return coordis.stream()
			.map(coordi -> {
				FileInfo thumbInfo = null;
				FileInfo aiFileInfo = null;

				try {
					if (coordi.getFileId() != null) {
						thumbInfo = fileMap.get(coordi.getFileId());
					}
					if (coordi.getAiFileId() != null) {
						aiFileInfo = aiFileMap.get(coordi.getAiFileId());
					}

					String originImageUrl = thumbInfo != null ? thumbInfo.getS3Url() : null;
					String thumbImageUrl = thumbInfo != null ? thumbInfo.getS3ThumbnailUrl() : null;
					String aiImageUrl = aiFileInfo != null ? aiFileInfo.getS3Url() : null;

					return toResponse(coordi, originImageUrl, thumbImageUrl, aiImageUrl);

				} catch (Exception e) {
					log.warn("⚠️ FileInfo 매핑 중 누락 발생 - coordiId={}, fileId={}, aiFileId={}",
						coordi.getCoordiId(), coordi.getFileId(), coordi.getAiFileId());
					return toResponse(coordi, null, null, null);
				}
			})
			.collect(Collectors.toList());
	}
}
