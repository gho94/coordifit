import { api } from "./axiosInstance";

class UserService {
  async updateUserProfile(userId, profileData) {
    try {
      const formData = new FormData();

      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key]);
        }
      });

      const response = await api.put(`/user/${userId}`, formData);
      return response.data;
    } catch (error) {
      console.error("프로필 업데이트 오류:", error);
      throw error;
    }
  }

  async logout(userId) {
    try {
      const response = await api.post("/auth/logout", userId);
      return response.data;
    } catch (error) {
      console.error("로그아웃 오류:", error);
      throw error;
    }
  }

  async deactivateAccount(userId) {
    try {
      const response = await api.delete(`/user/${userId}?isActive=N`);
      return response.data;
    } catch (error) {
      console.error("계정 비활성화 오류:", error);
      throw error;
    }
  }

  async activateAccount(userId) {
    try {
      const response = await api.delete(`/user/${userId}?isActive=Y`);
      return response.data;
    } catch (error) {
      console.error("계정 활성화 오류:", error);
      throw error;
    }
  }

  async getMyPageInfo(userId) {
    try {
      const response = await api.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error("마이페이지 정보 조회 오류:", error);
      throw error;
    }
  }

  async toggleFollow(userId) {
    try {
      const response = await api.post(`/user/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error("팔로우 처리 오류:", error);
      throw error;
    }
  }

  async checkFollowing(userId) {
    try {
      const response = await api.get(`/user/${userId}/follow`);
      return response.data;
    } catch (error) {
      console.error("팔로우 상태 조회 오류:", error);
      throw error;
    }
  }

  async getFollowers(userId) {
    try {
      const response = await api.get(`/user/${userId}/followers`);
      return response.data;
    } catch (error) {
      console.error("팔로워 목록 조회 오류:", error);
      throw error;
    }
  }

  async getFollowings(userId) {
    try {
      const response = await api.get(`/user/${userId}/followings`);
      return response.data;
    } catch (error) {
      console.error("팔로잉 목록 조회 오류:", error);
      throw error;
    }
  }
}

export default new UserService();
