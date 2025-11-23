import { api } from "./axiosInstance";

class PostService {
  async getAllPosts() {
    try {
      const response = await api.get("/posts");
      return response.data;
    } catch (error) {
      console.error("게시물 목록 조회 오류:", error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      const formData = new FormData();

      if (postData.content) formData.append("content", postData.content);
      formData.append("isPublic", postData.isPublic);

      if (postData.clothesIds && postData.clothesIds.length > 0) {
        postData.clothesIds.forEach((clothesId) => {
          formData.append("clothesIds", clothesId);
        });
      }

      if (postData.files && postData.files.length > 0) {
        postData.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await api.post("/posts", formData);
      return response.data;
    } catch (error) {
      console.error("게시물 등록 오류:", error);
      throw error;
    }
  }

  async getPostDetail(postId) {
    try {
      const response = await api.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("게시물 상세 조회 오류:", error);
      throw error;
    }
  }

  async createComment(postId, content, parentId = null) {
    try {
      const params = { content };
      if (parentId) {
        params.parentId = parentId;
      }

      const response = await api.post(`/posts/${postId}/comments`, null, { params });
      return response.data;
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      throw error;
    }
  }

  async getComments(postId) {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error("댓글 목록 조회 오류:", error);
      throw error;
    }
  }

  async togglePostLike(postId) {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error("게시글 좋아요 처리 오류:", error);
      throw error;
    }
  }

  async toggleCommentLike(commentId) {
    try {
      const response = await api.post(`/posts/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error("댓글 좋아요 처리 오류:", error);
      throw error;
    }
  }

  async getPostLikes(postId) {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      return response.data;
    } catch (error) {
      console.error("좋아요 목록 조회 오류:", error);
      throw error;
    }
  }

  async updatePost(postId, postData) {
    try {
      const formData = new FormData();

      if (postData.content) formData.append("content", postData.content);
      formData.append("isPublic", postData.isPublic);

      if (postData.clothesIds && postData.clothesIds.length > 0) {
        postData.clothesIds.forEach((clothesId) => {
          formData.append("clothesIds", clothesId);
        });
      }

      if (postData.deletedFileIds && postData.deletedFileIds.length > 0) {
        postData.deletedFileIds.forEach((fileId) => {
          formData.append("deletedFileIds", fileId);
        });
      }

      if (postData.files && postData.files.length > 0) {
        postData.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await api.put(`/posts/${postId}`, formData);
      return response.data;
    } catch (error) {
      console.error("게시물 수정 오류:", error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error("게시물 삭제 오류:", error);
      throw error;
    }
  }
}

export default new PostService();
