import { api } from "./axiosInstance";

const getAllCoordis = async () => {
  const response = await api.get("/coordi");

  return response.data;
};

const getCoordiById = async (coordiId) => {
  console.log("getCoordiById 호출됨");
  const response = await api.get(`/coordi/${coordiId}`);

  return response.data;
};

const createCoordi = async () => {
  const response = await api.post("/coordi");

  return response.data;
};

const deleteCoordi = async (coordiId) => {
  const response = await api.delete(`/coordi/${coordiId}`);

  return response.data;
};

const deleteCoordis = async (coordiIds) => {
  const response = await api.delete("/coordi", { data: coordiIds });

  return response.data;
};

export { getAllCoordis, getCoordiById, createCoordi, deleteCoordi, deleteCoordis };
