import { useQuery } from "@tanstack/react-query";

import { getAllCoordis, getCoordiById } from "@/services/coordiService";

export const useAllCoordisQuery = () => {
  return useQuery({
    queryKey: ["coordis"],
    queryFn: () => getAllCoordis(),
    staleTime: 1000 * 60 * 5,
    onError: (error) => {
      console.error("❌ 회원 모든 코디 조회 에러:", error);
    },
  });
};

export const useCoordiByIdQuery = (coordiId) => {
  return useQuery({
    queryKey: ["coordi", coordiId],
    queryFn: () => getCoordiById(coordiId),
    staleTime: 1000 * 60 * 5,
    onError: (error) => {
      console.error("❌ 회원 상세 코디 조회 에러:", error);
    },
  });
};
