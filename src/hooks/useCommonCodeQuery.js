import { useQuery, useQueryClient } from "@tanstack/react-query";

import commonCodeService from "@/services/commonCodeService";

export const useCommonCodesQuery = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["commonCodes"],
    queryFn: () => commonCodeService.getCommonCodes(),
    staleTime: 1000 * 60 * 10,
    retry: 1,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categoryData"] }),
  });
};

export const useCategoryQuery = () => {
  return useQuery({
    queryKey: ["categoryData"],
    queryFn: () => commonCodeService.getCategoryData(),
    staleTime: 1000 * 60 * 10,
    onError: (err) => {
      console.error("❌ 카테고리 조회 실패:", err);
    },
  });
};
