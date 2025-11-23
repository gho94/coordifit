package com.miracle.coordifit.clothes.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.calender.model.DailyLookItem;
import com.miracle.coordifit.clothes.dto.ClothesDetailResponse;
import com.miracle.coordifit.clothes.dto.ClothesResponse;
import com.miracle.coordifit.clothes.model.Clothes;
import com.miracle.coordifit.clothes.model.ClothesImage;

@Mapper
public interface ClothesRepository {

	int getNextClothesSequence();

	int insertClothes(Clothes clothes);

	int updateClothes(Clothes clothes);

	int insertClothesImage(ClothesImage clothesImage);

	List<ClothesResponse> selectUserClothes(@Param("userId") String userId);

	ClothesDetailResponse selectClothesById(@Param("clothesId") String clothesId, @Param("userId") String userId);

	List<ClothesDetailResponse.ClothesImage> selectClothesImage(@Param("clothesId") String clothesId);

	int deleteClothesImage(@Param("clothesId") String clothesId, @Param("fileId") Long fileId);

	int deleteClothes(Clothes clothes);

	int increaseWearCountByClothesId(DailyLookItem dailyLookItem);

	int decreaseWearCountByClothesIds(@Param("dailylookId") String dailylookId, @Param("userId") String userId);

	int updateLastWornDateByClothesId(DailyLookItem dailyLookItem);

	int updateLastWornDateByDailylookId(@Param("dailylookId") String dailylookId, @Param("userId") String userId);
}
