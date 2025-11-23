package com.miracle.coordifit.clothes.service;

import java.util.List;

import com.miracle.coordifit.clothes.dto.ClothesDetailResponse;
import com.miracle.coordifit.clothes.dto.ClothesRequest;
import com.miracle.coordifit.clothes.dto.ClothesResponse;
import com.miracle.coordifit.clothes.model.Clothes;

public interface IClothesService {

	Clothes createClothes(ClothesRequest request, String userId);

	Clothes updateClothes(String clothesId, ClothesRequest request, String userId);

	List<ClothesResponse> getUserClothes(String userId);

	ClothesDetailResponse getClothesDetail(String clothesId, String userId);

	Clothes deleteClothes(String clothesId, String userId);

	List<Clothes> bulkDeleteClothes(List<String> clothesIds, String userId);
}
