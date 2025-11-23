import { api } from "./axiosInstance";

const getDailyLooksByMonth = async (yearMonth) => {
  const response = await api.get("/daily-look/date", {
    params: { yearMonth },
  });

  return response.data;
};

const getDailyLookByDate = async (wearDate) => {
  const res = await api.get("/daily-look/date", { params: { wearDate } });

  return res.data;
};

const deleteDailyLookByDate = async (wearDate) => {
  const res = await api.delete(`/daily-look/date/${wearDate}`);

  return res.data;
};

const fetchDailylookSummary = async (yearMonth) => {
  const res = await api.get("/daily-look/summary", {
    params: { yearMonth },
  });

  return res.data;
};

export { getDailyLooksByMonth, getDailyLookByDate, deleteDailyLookByDate, fetchDailylookSummary };
