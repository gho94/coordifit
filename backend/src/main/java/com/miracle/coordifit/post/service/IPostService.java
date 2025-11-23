package com.miracle.coordifit.post.service;

import java.util.List;

import com.miracle.coordifit.post.dto.PostDetailResponse;
import com.miracle.coordifit.post.dto.PostDto;
import com.miracle.coordifit.post.dto.PostRequest;

public interface IPostService {

	void createPost(PostRequest request, String userId);

	void updatePost(String postId, PostRequest request, String userId);

	PostDetailResponse getPostDetail(String postId, String userId);

	List<PostDto> getAllPosts(String userId);

	void deletePost(String postId, String userId);
}
