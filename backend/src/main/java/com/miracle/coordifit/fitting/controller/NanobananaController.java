package com.miracle.coordifit.fitting.controller;

import java.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.miracle.coordifit.fitting.dto.FittingRequestDTO;
import com.miracle.coordifit.fitting.dto.ImageGenerationRequestDTO;
import com.miracle.coordifit.fitting.service.INanobananaService;
import com.miracle.coordifit.fitting.util.ImageUtil;

import lombok.RequiredArgsConstructor;

/**
 * 아바타 + 의류 기반 가상 피팅 API 컨트롤러 (자동분기 + 2단계 버전)
 * - 상의·하의·신발 중 2개 이하일 땐 단일 요청
 * - 3개(상의+하의+신발) 모두 있으면 2단계 처리 (신발은 나중에)
 */
@RestController
@RequestMapping("/api/nanobanana")
@RequiredArgsConstructor
public class NanobananaController {

	private final INanobananaService nanobananaService;

	@PostMapping("/fitting")
	public ResponseEntity<Map<String, Object>> fitting(@RequestBody FittingRequestDTO request) {
		try {
			long start = System.currentTimeMillis();
			String resultBase64;

			boolean hasTop = request.getTopImage() != null;
			boolean hasBottom = request.getBottomImage() != null;
			boolean hasShoes = request.getShoesImage() != null;

			int itemCount = 0;
			if (hasTop)
				itemCount++;
			if (hasBottom)
				itemCount++;
			if (hasShoes)
				itemCount++;

			// ✅ 로직: 2개 이하 → 단일 요청 / 3개 모두 → 2단계 요청
			if (itemCount < 3) {
				ImageGenerationRequestDTO singleRequest = buildSingleStepRequest(request);
				resultBase64 = nanobananaService.generateImageSync(singleRequest);
			} else {
				// --- 3개 모두 있을 때만 2단계 처리 ---
				ImageGenerationRequestDTO step1 = buildTopBottomRequest(request);
				String step1Result = nanobananaService.generateImageSync(step1);

				ImageGenerationRequestDTO step2 = buildShoesRequest(step1Result, request);
				resultBase64 = nanobananaService.generateImageSync(step2);
			}

			long duration = System.currentTimeMillis() - start;
			Map<String, Object> response = Map.of(
				"status", "success",
				"data", Map.of("imageBase64", resultBase64, "durationMs", duration));
			return ResponseEntity.ok(response);

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.internalServerError().body(Map.of(
				"status", "error",
				"message", "Fitting failed: " + e.getMessage()));
		}
	}

	/* =============================================================
	 * 🔹 (1단계) 상의 + 하의 합성 (신발 제외)
	 * ============================================================= */
	private ImageGenerationRequestDTO buildTopBottomRequest(FittingRequestDTO request) throws Exception {
		List<ImageGenerationRequestDTO.Part> parts = new ArrayList<>();

		parts.add(new ImageGenerationRequestDTO.Part(
			"""
				Step 1: Dress the avatar with the provided top and bottom clothing items by replacing existing garments.

				=== Composition Rules ===
				- Use the avatar image as the base.
				- Keep the face, hair, and body proportions identical to the original.
				- Completely remove any visible previous clothes from the torso and legs.
				- Apply the new top and bottom naturally to the correct body regions:
				  • Top → upper torso, arms, shoulders
				  • Bottom → hips, thighs, legs
				- Ensure there are no overlapping layers or visible edges; replace instead of overlay.
				- Preserve lighting, body pose, and camera perspective.
				""",
			null));

		// 순서 중요: Avatar → Top → Bottom
		parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getAvatarImage())));
		if (request.getTopImage() != null)
			parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getTopImage())));
		if (request.getBottomImage() != null)
			parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getBottomImage())));

		ImageGenerationRequestDTO dto = new ImageGenerationRequestDTO();
		dto.setContents(List.of(new ImageGenerationRequestDTO.Contents(parts)));
		dto.setGenerationConfig(new ImageGenerationRequestDTO.GenerationConfig(List.of("image")));
		return dto;
	}

	/* =============================================================
	 * 🔹 (2단계) 1단계 결과 + 신발 합성
	 * ============================================================= */
	private ImageGenerationRequestDTO buildShoesRequest(String base64Step1Result, FittingRequestDTO request)
		throws Exception {
		List<ImageGenerationRequestDTO.Part> parts = new ArrayList<>();

		parts.add(new ImageGenerationRequestDTO.Part(
			"""
				Step 2: Add the provided shoes naturally by replacing any existing footwear.

				=== Composition Rules ===
				- Use the provided composite image as the base.
				- Keep all upper body and clothing regions pixel-identical.
				- Remove any existing shoes or visible foot texture.
				- Apply the new shoes precisely over the feet, aligned with the avatar’s stance and leg direction.
				- Blend the shoes naturally with shadows, pant hems, and ground contact.
				- Maintain pose, proportions, and lighting consistency.
				""",
			null));

		// Base64 → InlineData 변환
		ImageGenerationRequestDTO.InlineData inlineData = new ImageGenerationRequestDTO.InlineData();
		inlineData.setMimeType("image/png");
		inlineData.setData(base64Step1Result);

		parts.add(new ImageGenerationRequestDTO.Part(null, inlineData));
		parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getShoesImage())));

		ImageGenerationRequestDTO dto = new ImageGenerationRequestDTO();
		dto.setContents(List.of(new ImageGenerationRequestDTO.Contents(parts)));
		dto.setGenerationConfig(new ImageGenerationRequestDTO.GenerationConfig(List.of("image")));
		return dto;
	}

	/* =============================================================
	 * 🔹 단일 요청용 (2개 이하)
	 * ============================================================= */
	private ImageGenerationRequestDTO buildSingleStepRequest(FittingRequestDTO request) throws Exception {
		List<ImageGenerationRequestDTO.Part> parts = new ArrayList<>();

		parts.add(new ImageGenerationRequestDTO.Part(
			"""
				Create a realistic fashion fitting image by replacing the avatar’s existing clothing or footwear
				with the provided items. Handle up to two items in one composition.

				=== Composition Rules ===
				- Use the avatar as the base reference.
				- Preserve the avatar’s **face, skin tone, hairstyle, pose, and body proportions** exactly.
				- For each provided item:
				  • Top → upper torso, shoulders, and arms
				  • Bottom → hips, thighs, and legs
				  • Shoes → feet and ankles
				- Remove any existing garments in the same region before applying new ones.
				- Ensure no double layering or overlap occurs.
				- Maintain realistic lighting, shading, and background consistency.
				""",
			null));

		// 순서 중요: Avatar → Top → Bottom → Shoes
		parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getAvatarImage())));
		if (request.getTopImage() != null)
			parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getTopImage())));
		if (request.getBottomImage() != null)
			parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getBottomImage())));
		if (request.getShoesImage() != null)
			parts.add(new ImageGenerationRequestDTO.Part(null, ImageUtil.urlToInlineData(request.getShoesImage())));

		ImageGenerationRequestDTO dto = new ImageGenerationRequestDTO();
		dto.setContents(List.of(new ImageGenerationRequestDTO.Contents(parts)));
		dto.setGenerationConfig(new ImageGenerationRequestDTO.GenerationConfig(List.of("image")));
		return dto;
	}
}
