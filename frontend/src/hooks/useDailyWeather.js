import { useEffect, useMemo, useState } from "react";

const isSameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isFutureYMD = (d) => {
  const today = new Date();
  const A = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const B = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return A.getTime() > B.getTime();
};

/**
 * 오늘 하루치 날씨(최고/최저/날씨코드) 훅
 * - 내부에서 geolocation 권한 요청 (거절 시 에러 메시지 반환)
 * - targetDate가 오늘이 아니면 "날짜 정보 없음"
 */
const useDailyWeather = (targetDate) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const isToday = useMemo(() => isSameYMD(targetDate, new Date()), [targetDate]);
  const isFuture = useMemo(() => isFutureYMD(targetDate), [targetDate]);

  useEffect(() => {
    setData(null);
    setError(null);

    // 미래/과거 처리
    if (isFuture) return; // 미래: 요청 안 함
    if (!isToday) {
      // 과거: 정책상 미지원
      setError("날짜 정보 없음");
      return;
    }

    // 브라우저/권한 체크
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("위치 정보를 가져올 수 없습니다");
      return;
    }

    let abort = false;
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (abort) return;
        const { latitude, longitude } = pos.coords;

        try {
          const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
            `&forecast_days=1&timezone=auto`;

          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error("날씨 API 오류");
          const json = await res.json();
          console.log("Weather API Row JSON", json);

          const tmax = json?.daily?.temperature_2m_max?.[0];
          const tmin = json?.daily?.temperature_2m_min?.[0];
          const wcode = json?.daily?.weathercode?.[0];

          if ([tmax, tmin, wcode].some((v) => typeof v !== "number")) {
            throw new Error("데이터 형식 오류");
          }
          if (!abort) setData({ tmax: Math.round(tmax), tmin: Math.round(tmin), wcode });
        } catch (e) {
          if (!abort) setError(e?.message || "날씨 데이터를 불러올 수 없습니다");
        } finally {
          if (!abort) setLoading(false);
        }
      },
      (geoErr) => {
        if (abort) return;
        setLoading(false);
        setError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? "위치 권한이 필요합니다"
            : "위치 정보를 가져올 수 없습니다",
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );

    return () => {
      abort = true;
    };
  }, [isFuture, isToday, targetDate]);

  return { loading, error, data, meta: { isToday, isFuture } };
};
export default useDailyWeather;
