package com.miracle.coordifit.post.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.miracle.coordifit.post.dto.CommentResponseDto;
import com.miracle.coordifit.post.model.Comment;
import com.miracle.coordifit.post.repository.CommentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService implements ICommentService {

	private final CommentRepository commentRepository;

	@Override
	@Transactional
	public void createComment(String postId, String content, String parentId, String userId) {
		String commentId = generateCommentId();

		Comment comment = Comment.builder()
			.commentId(commentId)
			.postId(postId)
			.userId(userId)
			.parentId(parentId)
			.content(content)
			.isActive("Y")
			.createdBy(userId)
			.build();

		int result = commentRepository.insertComment(comment);
		if (result <= 0) {
			throw new RuntimeException("댓글 등록 처리 중 오류가 발생했습니다.");
		}

		commentRepository.updateCommentCount(postId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<CommentResponseDto> getCommentsByPostId(String postId, String userId) {
		return commentRepository.getCommentsByPostId(postId, userId);
	}

	private String generateCommentId() {
		int nextSeq = commentRepository.getNextCommentSequence();
		return String.format("R%s%03d", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd")), nextSeq);
	}
}
