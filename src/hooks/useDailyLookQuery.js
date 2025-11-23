import { useQuery } from "@tanstack/react-query";

import {
  fetchDailylookSummary,
  getDailyLookByDate,
  getDailyLooksByMonth,
} from "@/services/dailyLookApi";

const useDailyLookByDateQuery = (wearDate) => {
  return useQuery({
    queryKey: ["dailyLook", wearDate],
    queryFn: () => getDailyLookByDate(wearDate),
    staleTime: 1000 * 60 * 5,
    enabled: !!wearDate,
  });
};
const useDailyLooksByMonthQuery = (yearMonth) => {
  return useQuery({
    queryKey: ["dailyLooks", yearMonth],
    queryFn: () => getDailyLooksByMonth(yearMonth),
    staleTime: 1000 * 60 * 5,
    enabled: !!yearMonth,
  });
};

function useDailylookSummaryQuery(yearMonth) {
  return useQuery({
    queryKey: ["dailylookSummary", yearMonth || "current"],
    queryFn: () => fetchDailylookSummary(yearMonth),
    staleTime: 60_000,
    enabled: !!yearMonth,
  });
}

export { useDailyLooksByMonthQuery, useDailyLookByDateQuery, useDailylookSummaryQuery };
