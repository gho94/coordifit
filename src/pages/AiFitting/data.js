import bottomIcon from "@/assets/images/bottomicon.png";
import shoesIcon from "@/assets/images/shoesicon.png";
import topIcon from "@/assets/images/topicon.png";

export const clothingTypes = [
  { id: "top", label: "상의", icon: topIcon },
  { id: "bottom", label: "하의", icon: bottomIcon },
  { id: "shoes", label: "신발", icon: shoesIcon },
];

// API 카테고리 코드 매핑
export const API_CATEGORY_MAPPING = {
  // 상의 카테고리들
  B30001: { type: "top", subCategory: "shirts", name: "셔츠" },
  B30002: { type: "top", subCategory: "polo", name: "카라티" },
  B30003: { type: "top", subCategory: "short-sleeve", name: "반팔티" },
  B30004: { type: "top", subCategory: "long-sleeve", name: "긴팔티" },
  B30005: { type: "top", subCategory: "hoodie", name: "후드티" },
  B30006: { type: "top", subCategory: "sweatshirt", name: "맨투맨" },
  B30007: { type: "top", subCategory: "knit", name: "니트" },
  B30008: { type: "top", subCategory: "sleeveless", name: "민소매" },
  B30009: { type: "top", subCategory: "dress", name: "원피스" },
  B30010: { type: "top", subCategory: "other", name: "기타상의" },

  // 하의 카테고리들
  B30011: { type: "bottom", subCategory: "shorts", name: "반바지" },
  B30012: { type: "bottom", subCategory: "jeans", name: "청바지" },
  B30013: { type: "bottom", subCategory: "slacks", name: "슬랙스" },
  B30014: { type: "bottom", subCategory: "cotton-pants", name: "면바지" },
  B30015: { type: "bottom", subCategory: "training-pants", name: "트레이닝바지" },
  B30016: { type: "bottom", subCategory: "leggings", name: "레깅스" },
  B30017: { type: "bottom", subCategory: "skirt", name: "치마" },
  B30018: { type: "bottom", subCategory: "other", name: "기타하의" },

  // 신발 카테고리들
  B30019: { type: "shoes", subCategory: "sneakers", name: "스니커즈" },
  B30020: { type: "shoes", subCategory: "padding-shoes", name: "패딩/퍼신발" },
  B30021: { type: "shoes", subCategory: "boots", name: "부츠/워커" },
  B30022: { type: "shoes", subCategory: "dress-shoes", name: "구두" },
  B30023: { type: "shoes", subCategory: "sandals", name: "샌들" },
  B30024: { type: "shoes", subCategory: "sports-shoes", name: "스포츠화" },
  B30025: { type: "shoes", subCategory: "other", name: "기타신발" },
};

// 상위 카테고리별 하위 카테고리 구조
export const CLOTHING_CATEGORIES = {
  top: {
    id: "top",
    name: "상의",
    subcategories: [
      { id: "all", name: "전체" },
      { id: "shirts", name: "셔츠" },
      { id: "polo", name: "카라티" },
      { id: "short-sleeve", name: "반팔티" },
      { id: "long-sleeve", name: "긴팔티" },
      { id: "hoodie", name: "후드티" },
      { id: "sweatshirt", name: "맨투맨" },
      { id: "knit", name: "니트" },
      { id: "sleeveless", name: "민소매" },
      { id: "dress", name: "원피스" },
      { id: "other", name: "기타상의" },
    ],
  },
  bottom: {
    id: "bottom",
    name: "하의",
    subcategories: [
      { id: "all", name: "전체" },
      { id: "shorts", name: "반바지" },
      { id: "jeans", name: "청바지" },
      { id: "slacks", name: "슬랙스" },
      { id: "cotton-pants", name: "면바지" },
      { id: "training-pants", name: "트레이닝바지" },
      { id: "leggings", name: "레깅스" },
      { id: "skirt", name: "치마" },
      { id: "other", name: "기타하의" },
    ],
  },
  shoes: {
    id: "shoes",
    name: "신발",
    subcategories: [
      { id: "all", name: "전체" },
      { id: "sneakers", name: "스니커즈" },
      { id: "padding-shoes", name: "패딩/퍼신발" },
      { id: "boots", name: "부츠/워커" },
      { id: "dress-shoes", name: "구두" },
      { id: "sandals", name: "샌들" },
      { id: "sports-shoes", name: "스포츠화" },
      { id: "other", name: "기타신발" },
    ],
  },
};

export const closetCategoryMap = {
  top: "top",
  bottom: "bottom",
  shoes: "shoes",
};

// API 데이터를 화면용 데이터로 변환하는 유틸리티 함수
export const transformClothesApiData = (apiClothes) => {
  if (!apiClothes || !Array.isArray(apiClothes)) return [];

  return apiClothes.map((item) => {
    const categoryInfo = API_CATEGORY_MAPPING[item.categoryCode];

    return {
      id: item.clothesId,
      name: item.name,
      category: categoryInfo?.type || "unknown",
      subCategory: categoryInfo?.subCategory || "other",
      categoryName: categoryInfo?.name || "알 수 없음",
      purchaseDate: item.purchaseDate,
      wearCount: item.wearCount || 0,
      lastWornDate: item.lastWornDate,
      images: [item.imageUrl], // imageUrl 사용
      // API 원본 데이터도 보관
      apiData: item,
    };
  });
};

// 카테고리별로 옷 데이터를 그룹화하는 함수
export const groupClothesByCategory = (transformedClothes) => {
  const grouped = {
    top: [],
    bottom: [],
    shoes: [],
  };

  transformedClothes.forEach((item) => {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  });

  return grouped;
};
