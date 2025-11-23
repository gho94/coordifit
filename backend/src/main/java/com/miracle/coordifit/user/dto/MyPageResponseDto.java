package com.miracle.coordifit.user.dto;

import java.util.List;

import com.miracle.coordifit.post.dto.PostDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MyPageResponseDto {
	private String userId;
	private String nickname;
	private String email;
	private String profileImageUrl;
	private int postsCount;
	private int followersCount;
	private int followingsCount;
	private List<PostDto> posts;
	private List<PostDto> likedPosts;
}
