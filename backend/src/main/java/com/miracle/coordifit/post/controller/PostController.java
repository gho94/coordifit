package com.miracle.coordifit.post.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.miracle.coordifit.common.dto.ApiResponseDto;
import com.miracle.coordifit.post.dto.CommentResponseDto;
import com.miracle.coordifit.post.dto.PostDetailResponse;
import com.miracle.coordifit.post.dto.PostDto;
import com.miracle.coordifit.post.dto.PostRequest;
import com.miracle.coordifit.post.service.ICommentService;
import com.miracle.coordifit.post.service.ILikeService;
import com.miracle.coordifit.post.service.IPostService;
import com.miracle.coordifit.user.dto.UserDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

	private final IPostService postService;
	private final ICommentService commentService;
	private final ILikeService likeService;

	@GetMapping
	public ResponseEntity<ApiResponseDto<List<PostDto>>> getAllPosts(Authentication authentication) {
		List<PostDto> posts = postService.getAllPosts(authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("전체 게시물 조회 성공", posts));
	}

	@PostMapping
	public ResponseEntity<ApiResponseDto<Void>> createPost(
		@Valid PostRequest request,
		Authentication authentication) {
		postService.createPost(request, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("게시물 등록 완료"));
	}

	@GetMapping("/{postId}")
	public ResponseEntity<ApiResponseDto<PostDetailResponse>> getPostDetail(
		@PathVariable String postId,
		Authentication authentication) {
		PostDetailResponse postDetail = postService.getPostDetail(postId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("게시물 상세 조회 성공", postDetail));
	}

	@PutMapping("/{postId}")
	public ResponseEntity<ApiResponseDto<Void>> updatePost(
		@PathVariable String postId,
		@Valid PostRequest request,
		Authentication authentication) {
		postService.updatePost(postId, request, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("게시물 수정 완료"));
	}

	@PostMapping("/{postId}/like")
	public ResponseEntity<ApiResponseDto<Void>> togglePostLike(
		@PathVariable String postId,
		Authentication authentication) {
		likeService.toggleLike(postId, "POST", authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("좋아요 처리 완료"));
	}

	@PostMapping("/{postId}/comments")
	public ResponseEntity<ApiResponseDto<Void>> createComment(
		@PathVariable String postId,
		@RequestParam String content,
		@RequestParam(required = false) String parentId,
		Authentication authentication) {
		commentService.createComment(postId, content, parentId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("댓글 등록 완료"));
	}

	@GetMapping("/{postId}/comments")
	public ResponseEntity<ApiResponseDto<List<CommentResponseDto>>> getComments(
		@PathVariable String postId,
		Authentication authentication) {
		List<CommentResponseDto> comments = commentService.getCommentsByPostId(postId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("댓글 목록 조회 성공", comments));
	}

	@PostMapping("/comments/{commentId}/like")
	public ResponseEntity<ApiResponseDto<Void>> toggleCommentLike(
		@PathVariable String commentId,
		Authentication authentication) {
		likeService.toggleLike(commentId, "COMMENT", authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("댓글 좋아요 처리 완료"));
	}

	@GetMapping("/{postId}/likes")
	public ResponseEntity<ApiResponseDto<List<UserDto>>> getPostLikes(
		@PathVariable String postId) {
		List<UserDto> likeUsers = likeService.getLikeUsers(postId);
		return ResponseEntity.ok(ApiResponseDto.success("좋아요 목록 조회 성공", likeUsers));
	}

	@DeleteMapping("/{postId}")
	public ResponseEntity<ApiResponseDto<Void>> deletePost(
		@PathVariable String postId,
		Authentication authentication) {
		postService.deletePost(postId, authentication.getName());
		return ResponseEntity.ok(ApiResponseDto.success("게시물 삭제 성공"));
	}
}
