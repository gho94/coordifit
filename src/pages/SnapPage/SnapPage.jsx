import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import postService from "../../services/postService";
import styles from "./SnapPage.module.css";

// 카테고리 아이콘 import
import allIcon from "@/assets/images/mainpage/allicon.png";
import shirtIcon from "@/assets/images/mainpage/shirt.png";
import poloIcon from "@/assets/images/mainpage/kara.png";
import shortSleeveIcon from "@/assets/images/mainpage/short.png";
import longSleeveIcon from "@/assets/images/mainpage/long.png";
import hoodieIcon from "@/assets/images/mainpage/hood.png";
import shortsIcon from "@/assets/images/mainpage/shortpants.png";
import jeansIcon from "@/assets/images/mainpage/jeans.png";
import skirtIcon from "@/assets/images/mainpage/skirt.png";
import coatIcon from "@/assets/images/mainpage/coat.png";
import paddingIcon from "@/assets/images/mainpage/jumper.png";
import sneakersIcon from "@/assets/images/mainpage/sneakers.png";
import dressShoesIcon from "@/assets/images/mainpage/shoes.png";

// 카테고리 구성 (13개)
const CATEGORY_TABS = [
  { id: "all", label: "전체", icon: allIcon },
  { id: "B30001", label: "셔츠", icon: shirtIcon },
  { id: "B30002", label: "카라티", icon: poloIcon },
  { id: "B30003", label: "반팔", icon: shortSleeveIcon },
  { id: "B30004", label: "긴팔", icon: longSleeveIcon },
  { id: "B30005", label: "후드", icon: hoodieIcon },
  { id: "B30011", label: "반바지", icon: shortsIcon },
  { id: "B30012", label: "청바지", icon: jeansIcon },
  { id: "B30017", label: "치마", icon: skirtIcon },
  { id: "B30026", label: "코트", icon: coatIcon },
  { id: "B30028", label: "패딩", icon: paddingIcon },
  { id: "B30019", label: "스니커즈", icon: sneakersIcon },
  { id: "B30022", label: "구두", icon: dressShoesIcon },
];

const SnapPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest"); // latest, popular
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortContainerRef = useRef(null);

  // 페이지 진입 시 스크롤 초기화
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 드롭다운 바깥쪽 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortDropdown]);

  // 게시물 목록 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await postService.getAllPosts();
        console.log("게시물 목록 응답:", response);

        // API 응답 구조에 따라 데이터 추출
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];

        if (items.length > 0) {
          setPosts(items);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error("게시물 목록 로드 실패:", err);
        setError("게시물을 불러오는데 실패했습니다.");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // 카테고리별 게시물 필터링 및 정렬
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // 카테고리 필터링
    if (activeCategory !== "all") {
      filtered = posts.filter((post) => {
        const postCategoryCodes = post.categoryCodes || [];
        return postCategoryCodes.includes(activeCategory);
      });
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "popular") {
        // 인기순 (좋아요 수 기준)
        return (b.likeCount || 0) - (a.likeCount || 0);
      } else {
        // 최신순 (생성일 기준)
        return (
          new Date(b.createdAt || b.createTime || 0) - new Date(a.createdAt || a.createTime || 0)
        );
      }
    });

    return sorted;
  }, [posts, activeCategory, sortOrder]);

  const handlePostClick = (postId) => {
    navigate(`/snap/${postId}`);
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
    setShowSortDropdown(false);
  };

  const getSortLabel = () => {
    return sortOrder === "popular" ? "인기순" : "최신순";
  };

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <p>오류: {error}</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 카테고리 탭 - 고정 */}
      <div className={styles.categoryContainer}>
        <div className={styles.categoryScroller}>
          {CATEGORY_TABS.map((category) => (
            <div key={category.id} className={styles.categoryItem}>
              <button
                type="button"
                className={`${
                  styles.categoryButton
                } ${activeCategory === category.id ? styles.activeCategoryButton : ""}`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={styles.categoryImageBox}>
                  <img src={category.icon} alt={category.label} className={styles.categoryImage} />
                </div>
              </button>
              <span className={styles.categoryLabel}>{category.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className={styles.contentArea}>
        {/* 게시물 개수 및 정렬 */}
        <div className={styles.postHeader}>
          <div className={styles.postCount}>총 {filteredPosts.length.toLocaleString()}건</div>
          <div className={styles.sortContainer} ref={sortContainerRef}>
            <button
              className={styles.sortButton}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              {getSortLabel()}
              <svg className={styles.sortArrow} viewBox="0 0 12 8" fill="none">
                <path
                  d="M1 1L6 6L11 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showSortDropdown && (
              <div className={styles.sortDropdown}>
                <button
                  className={`${styles.sortOption} ${sortOrder === "latest" ? styles.activeSortOption : ""}`}
                  onClick={() => handleSortChange("latest")}
                >
                  최신순
                </button>
                <button
                  className={`${styles.sortOption} ${sortOrder === "popular" ? styles.activeSortOption : ""}`}
                  onClick={() => handleSortChange("popular")}
                >
                  인기순
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className={styles.postList}>
            {filteredPosts.map((post) => (
              <div
                key={post.postId}
                className={styles.postCard}
                onClick={() => handlePostClick(post.postId)}
              >
                <div className={styles.postImage}>
                  <img
                    src={
                      post.imageUrls?.[0] ||
                      post.imageUrl ||
                      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80"
                    }
                    alt="게시물"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyContainer}>
            <p>등록된 게시물이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapPage;
