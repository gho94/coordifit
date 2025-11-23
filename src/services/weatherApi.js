import { pastWeatherApi, weatherApi } from "./axiosInstance"; // 기존 axios 인스턴스

// 오늘 / 미래 하루치
export const getCurrentWeather = async ({ lat, lng, dateString }) => {
  const path = "/v1/forecast";
  const params = {
    latitude: lat,
    longitude: lng,
    daily: "temperature_2m_max,temperature_2m_min,weathercode",
    start_date: dateString,
    end_date: dateString,
  };

  const res = await weatherApi.get(path, { params });
  console.log("Weather API Row data: ", res);

  const d = res.data?.daily || {};
  const tmax = d.temperature_2m_max?.[0];
  const tmin = d.temperature_2m_min?.[0];
  const wcode = d.weathercode?.[0];

  if ([tmax, tmin, wcode].some((v) => typeof v !== "number")) {
    const err = new Error("날짜 정보 없음");
    err.code = "NO_DATA";
    throw err;
  }
  return { tmax: Math.round(tmax), tmin: Math.round(tmin), wcode };
};

// 과거 하루치 데이터
export const getPastWeather = async ({ lat, lng, dateString }) => {
  const path = "/v1/forecast";
  console.log("day 과거 데이터 호출", dateString);
  const params = {
    latitude: lat,
    longitude: lng,
    daily: "temperature_2m_max,temperature_2m_min,weathercode",
    start_date: dateString,
    end_date: dateString,
  };

  const res = await weatherApi.get(path, { params });
  console.log("Weather API Row data: ", res);

  const d = res.data?.daily ?? {};
  const tmax = d.temperature_2m_max?.[0];
  const tmin = d.temperature_2m_min?.[0];
  const wcode = d.weathercode?.[0];

  if ([tmax, tmin, wcode].some((v) => typeof v !== "number")) {
    const err = new Error("날짜 정보 없음");
    err.code = "NO_DATA";
    throw err;
  }
  return { tmax: Math.round(tmax), tmin: Math.round(tmin), wcode };
};

export const getCurrentWeatherRange = async ({ lat, lng, startDate, endDate }) => {
  const res = await weatherApi.get("/v1/forecast", {
    params: {
      latitude: lat,
      longitude: lng,
      daily: "temperature_2m_max,temperature_2m_min,weathercode",
      start_date: startDate,
      end_date: endDate,
    },
  });
  console.log("Weather API Row data: ", res);

  const daily = res.data?.daily;
  if (!daily?.time?.length) throw new Error(">> 날씨 데이터 호출 에러");

  return daily;
};

export const getPastWeatherRange = async ({ lat, lng, startDate, endDate }) => {
  const res = await pastWeatherApi.get("/v1/archive", {
    params: {
      latitude: lat,
      longitude: lng,
      daily: "temperature_2m_max,temperature_2m_min,weathercode",
      start_date: startDate,
      end_date: endDate,
    },
  });
  console.log("Weather API Row data: ", res);

  const daily = res.data?.daily;
  if (!daily?.time?.length) throw new Error(">> 날씨 데이터 호출 에러");

  return daily;
};
