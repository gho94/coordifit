import { useEffect, useState } from "react";

import {
  WiDaySunny,
  WiCloud,
  WiRain,
  WiStormShowers,
  WiSnowflakeCold,
  WiDayFog,
} from "react-icons/wi";
import classNames from "classnames/bind";

import { useDailyWeatherQuery } from "@/hooks/useDailyWeatherQuery";
import styles from "./Weather.module.css";

const cn = classNames.bind(styles);

const iconByCode = (code) => {
  if (code === 0) return <WiDaySunny />;
  if ([1, 2, 3].includes(code)) return <WiCloud />;
  if ([45, 48].includes(code)) return <WiDayFog />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <WiRain />;
  if ([95, 96, 99].includes(code)) return <WiStormShowers />;
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return <WiSnowflakeCold />;
  return <WiCloud />;
};

const Weather = ({ targetDate }) => {
  const [geoTried, setGeoTried] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoTried(true);
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoTried(true);
      },
      () => {
        if (!cancelled) setGeoTried(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const q = useDailyWeatherQuery(targetDate, coords);

  if (!coords)
    return geoTried ? null : (
      <div className={cn("badge")}>
        <span className={cn("loadingText")}>위치 확인 중…</span>
      </div>
    );

  if (q.isLoading) {
    return (
      <div className={cn("badge")}>
        <span className={cn("loadingText")}>날씨 불러오는 중…</span>
      </div>
    );
  }
  if (q.isError || !q.data) return null;

  const { tmax, tmin, wcode } = q.data;

  return (
    <div className={cn("badge")}>
      <span className={cn("icon")}>{iconByCode(wcode)}</span>
      <span className={cn("text")}>{`${tmax}°C / ${tmin}°C`}</span>
    </div>
  );
};

export default Weather;
