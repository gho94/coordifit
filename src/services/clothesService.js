import { api } from "./axiosInstance";

class ClothesService {
  async createClothes(clothesData) {
    try {
      const formData = new FormData();

      if (clothesData.name) formData.append("name", clothesData.name);
      if (clothesData.brand) formData.append("brand", clothesData.brand);
      if (clothesData.categoryCode) formData.append("categoryCode", clothesData.categoryCode);
      if (clothesData.clothesSize) formData.append("clothesSize", clothesData.clothesSize);
      if (clothesData.price) formData.append("price", clothesData.price);
      if (clothesData.purchaseDate) formData.append("purchaseDate", clothesData.purchaseDate);
      if (clothesData.purchaseUrl) formData.append("purchaseUrl", clothesData.purchaseUrl);
      if (clothesData.description) formData.append("description", clothesData.description);

      if (clothesData.files && clothesData.files.length > 0) {
        clothesData.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await api.post("/clothes", formData);
      return response.data;
    } catch (error) {
      console.error("옷 등록 오류:", error);
      throw error;
    }
  }

  async getUserClothes() {
    try {
      const response = await api.get("/clothes");
      return response.data;
    } catch (error) {
      console.error("옷 목록 조회 오류:", error);
      throw error;
    }
  }

  async getClothesDetail(clothesId) {
    try {
      const response = await api.get(`/clothes/${clothesId}`);
      return response.data;
    } catch (error) {
      console.error("옷 상세 조회 오류:", error);
      throw error;
    }
  }

  async updateClothes(clothesId, clothesData) {
    try {
      const formData = new FormData();

      if (clothesData.name) formData.append("name", clothesData.name);
      if (clothesData.brand) formData.append("brand", clothesData.brand);
      if (clothesData.categoryCode) formData.append("categoryCode", clothesData.categoryCode);
      if (clothesData.clothesSize) formData.append("clothesSize", clothesData.clothesSize);
      if (clothesData.price) formData.append("price", clothesData.price);
      if (clothesData.purchaseDate) formData.append("purchaseDate", clothesData.purchaseDate);
      if (clothesData.purchaseUrl) formData.append("purchaseUrl", clothesData.purchaseUrl);
      if (clothesData.description) formData.append("description", clothesData.description);

      // 삭제할 이미지 fileId 목록
      if (clothesData.deletedFileIds && clothesData.deletedFileIds.length > 0) {
        clothesData.deletedFileIds.forEach((fileId) => {
          formData.append("deletedFileIds", fileId);
        });
      }

      // 새로 추가할 이미지
      if (clothesData.files && clothesData.files.length > 0) {
        clothesData.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await api.put(`/clothes/${clothesId}`, formData);
      return response.data;
    } catch (error) {
      console.error("옷 수정 오류:", error);
      throw error;
    }
  }

  async deleteClothes(clothesId) {
    try {
      const response = await api.delete(`/clothes/${clothesId}`);
      return response.data;
    } catch (error) {
      console.error("옷 삭제 오류:", error);
      throw error;
    }
  }

  async bulkDeleteClothes(clothesIds) {
    try {
      if (!Array.isArray(clothesIds) || clothesIds.length === 0) {
        throw new Error("삭제할 옷 ID 목록이 비어있습니다.");
      }
      const response = await api.delete("/clothes/bulk", { data: clothesIds });
      return response.data;
    } catch (error) {
      console.error("옷 일괄 삭제 오류:", error);
      throw error;
    }
  }
}

export default new ClothesService();
