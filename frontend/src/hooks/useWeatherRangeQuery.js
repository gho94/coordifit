import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { getCurrentWeatherRange, getPastWeatherRange } from "@/services/weatherApi";
import { addDays, clampFutureLimit, daysDiffFromToday, formatDate } from "@/utils/calendarUtils";
import { mergeDaily } from "@/utils/weatherUtils";

const MAX_FUTURE_DATE = 12;
const PREFETCH_ENABLED = true;

const fetchMixedRange = async ({ lat, lng, startDate, endDate }) => {
  const today = new Date();
  const todayY = formatDate(today);
  const [pastWeather, futureWeather] = await Promise.all([
    getPastWeatherRange({ lat, lng, startDate, endDate: todayY }),
    getCurrentWeatherRange({ lat, lng, startDate: todayY, endDate }),
  ]);
  return mergeDaily(pastWeather, futureWeather);
};
/**
 * 날짜 범위 조회 + 다음/이전 prefetch
 *
 * @param { lat:number, lng:number } coords
 * @param { string } startDate - "YYYY-MM-DD"
 * @param { string } endDate   - "YYYY-MM-DD"
 * @param {{chunkSize?:number, prefetch?:boolean}} options
 *   - chunkSize: 좌우로 넘길 때 한 번에 이동/미리 로드할 일수(기본 5)
 *   - prefetch: 프리페치 on/off
 */
const useWeatherRangeQuery = (coords, startDate, endDate, options = {}) => {
  const queryClient = useQueryClient();
  const { chunkSize = 5, prefetch = true } = options;

  const startDiff = useMemo(() => daysDiffFromToday(startDate), [startDate]);
  const endDiff = useMemo(() => daysDiffFromToday(endDate), [endDate]);

  const allFuture = startDiff >= 0;
  const allPast = endDiff < 0;
  const isMixed = startDiff < 0 && endDiff >= 0; // 과거 + 현재
  const isExistCoordi = !!coords?.lat && !!coords?.lng;

  // 현재 구간 데이터 쿼리
  const query = useQuery({
    queryKey: ["weatherRange", coords?.lat, coords?.lng, startDate, endDate],
    queryFn: async () => {
      if (allPast) {
        return getPastWeatherRange({
          lat: coords.lat,
          lng: coords.lng,
          startDate: startDate,
          endDate: endDate,
        });
      } else if (allFuture) {
        const clamped = clampFutureLimit(startDate, endDate, MAX_FUTURE_DATE);
        return getCurrentWeatherRange({
          lat: coords.lat,
          lng: coords.lng,
          startDate: formatDate(clamped.start),
          endDate: formatDate(clamped.end),
        });
      } else if (isMixed) {
        return fetchMixedRange({
          lat: coords.lat,
          lng: coords.lng,
          startDate: startDate,
          endDate: endDate,
        });
      }
    },
    enabled: isExistCoordi,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  useEffect(() => {
    if (!PREFETCH_ENABLED || !query.data || !coords?.lat || !coords?.lng) return;

    const doPrefetch = async (rangeStart, rangeEnd) => {
      const sDiff = daysDiffFromToday(rangeStart);
      const eDiff = daysDiffFromToday(rangeEnd);

      const key = [
        "weatherRange",
        coords.lat,
        coords.lng,
        formatDate(rangeStart),
        formatDate(rangeEnd),
      ];

      if (eDiff < 0) {
        // 전부 과거
        await queryClient.prefetchQuery({
          queryKey: key,
          queryFn: () =>
            getPastWeatherRange({
              lat: coords.lat,
              lng: coords.lng,
              startDate: formatDate(rangeStart),
              endDate: formatDate(rangeEnd),
            }),
          staleTime: 1000 * 60 * 30,
        });
      } else if (sDiff >= 0) {
        const clamped = clampFutureLimit(rangeStart, rangeEnd, MAX_FUTURE_DATE);
        if (clamped.end < rangeStart) return; // 전부 제한 밖이면 스킵

        await queryClient.prefetchQuery({
          queryKey: key,
          queryFn: () =>
            getCurrentWeatherRange({
              lat: coords.lat,
              lng: coords.lng,
              startDate: formatDate(clamped.start),
              endDate: formatDate(clamped.end),
            }),
          staleTime: 1000 * 60 * 30,
        });
      } else {
        // 혼합 구간
        await queryClient.prefetchQuery({
          queryKey: key,
          queryFn: () =>
            fetchMixedRange({
              lat: coords.lat,
              lng: coords.lng,
              startDate: formatDate(rangeStart),
              endDate: formatDate(rangeEnd),
            }),
          staleTime: 1000 * 60 * 30,
        });
      }
    };

    // 다음(+chunkSize) 구간
    const nextStart = addDays(endDate, 1);
    const nextEnd = addDays(endDate, chunkSize);
    doPrefetch(nextStart, nextEnd);

    // 이전(-chunkSize) 구간
    const prevStart = addDays(startDate, -chunkSize);
    const prevEnd = addDays(startDate, -1);
    doPrefetch(prevStart, prevEnd);
  }, [query.data, coords?.lat, coords?.lng, startDate, endDate, chunkSize, prefetch]);

  return query;
};

export { useWeatherRangeQuery };
