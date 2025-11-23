import { useQuery } from "@tanstack/react-query";

import clothesService from "@/services/clothesService";

export const useClothesQuery = (options = {}) => {
  return useQuery({
    queryKey: ["clothes"],
    queryFn: () => clothesService.getUserClothes(),
    staleTime: 1000 * 60 * 5,
    onError: (error) => {
      console.error("❌ 옷 목록 조회 에러:", error);
    },
    ...options,
  });
};
