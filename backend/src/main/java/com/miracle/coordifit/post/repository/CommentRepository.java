package com.miracle.coordifit.post.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.miracle.coordifit.post.dto.CommentResponseDto;
import com.miracle.coordifit.post.model.Comment;

@Mapper
public interface CommentRepository {

	int getNextCommentSequence();

	int insertComment(Comment comment);

	int updateCommentCount(@Param("postId") String postId);

	List<CommentResponseDto> getCommentsByPostId(@Param("postId") String postId, @Param("userId") String userId);
}
