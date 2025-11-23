import { api } from "./axiosInstance";

class CommonCodeService {
  async getCommonCodes() {
    try {
      const response = await api.get("/common-codes");
      return response.data;
    } catch (error) {
      console.error("공통코드 조회 오류:", error);
      throw error;
    }
  }

  async getCategoryData() {
    try {
      const response = await api.get("/common-codes/category");
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "카테고리 데이터 조회에 실패했습니다.");
      }
    } catch (error) {
      console.error("카테고리 데이터 조회 오류:", error);
      throw error;
    }
  }

  async getCommonCodesByParentCodeId(parentCodeId) {
    try {
      const response = await api.get(`/common-codes/${parentCodeId}`);
      return response.data;
    } catch (error) {
      console.error("공통코드 조회 오류:", error);
      throw error;
    }
  }

  async createCommonCode(commonCodeData) {
    try {
      const response = await api.post("/common-codes", commonCodeData);
      return response.data;
    } catch (error) {
      console.error("공통코드 생성 오류:", error);
      throw error;
    }
  }

  async updateCommonCode(codeId, commonCodeData) {
    try {
      const response = await api.put(`/common-codes/${codeId}`, commonCodeData);
      return response.data;
    } catch (error) {
      console.error("공통코드 수정 오류:", error);
      throw error;
    }
  }

  async deleteCommonCode(codeId) {
    try {
      const response = await api.delete(`/common-codes/${codeId}`);
      return response.data;
    } catch (error) {
      console.error("공통코드 삭제 오류:", error);
      throw error;
    }
  }
}

export default new CommonCodeService();
