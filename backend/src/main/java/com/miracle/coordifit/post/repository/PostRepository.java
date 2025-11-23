package com.miracle.coordifit.post.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.post.dto.PostClothesResponse;
import com.miracle.coordifit.post.dto.PostDetailResponse;
import com.miracle.coordifit.post.dto.PostDto;
import com.miracle.coordifit.post.model.Post;
import com.miracle.coordifit.post.model.PostClothes;
import com.miracle.coordifit.post.model.PostImage;

@Mapper
public interface PostRepository {

	int getNextPostSequence();

	int insertPost(Post post);

	int updatePost(Post post);

	int insertPostImage(PostImage postImage);

	int insertPostClothes(PostClothes postClothes);

	int deletePostImage(@Param("postId") String postId, @Param("fileId") Long fileId);

	int deletePostClothes(@Param("postId") String postId);

	PostDetailResponse getPostDetail(@Param("postId") String postId);

	List<PostDetailResponse.PostImage> getPostImages(@Param("postId") String postId);

	List<PostClothesResponse> getPostClothes(@Param("postId") String postId);

	void incrementViewCount(@Param("postId") String postId);

	List<PostDto> getAllPosts(@Param("userId") String userId);

	List<PostDto> getUserPosts(@Param("userId") String userId, @Param("isPublic") Boolean isPublic);

	List<PostDto> getUserLikedPosts(@Param("userId") String userId);
}
