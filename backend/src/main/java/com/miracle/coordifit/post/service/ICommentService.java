package com.miracle.coordifit.post.service;

import java.util.List;

import com.miracle.coordifit.post.dto.CommentResponseDto;

public interface ICommentService {

	void createComment(String postId, String content, String parentId, String userId);

	List<CommentResponseDto> getCommentsByPostId(String postId, String userId);
}
