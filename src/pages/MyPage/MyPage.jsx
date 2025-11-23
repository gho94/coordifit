import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Tabs from "@/components/Tabs/Tabs";
import BottomSheet from "@/components/BottomSheet/BottomSheet";
import userService from "@/services/userService";
import { useUserStore } from "@/stores/userStore";
import { useSnapStore } from "@/stores/snapStore";
import profileImage from "@/assets/images/profile.png";
import styles from "./MyPage.module.css";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

const TAB_ITEMS = [
  { id: "snap", label: "스냅", icon: "grid" },
  { id: "liked", label: "좋아요", icon: "heart" },
];

const getTabItems = (isMyPage) => {
  return isMyPage ? TAB_ITEMS : TAB_ITEMS.filter((item) => item.id !== "liked");
};
const MyPage = () => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const { user } = useUserStore();
  const { clearSnapData } = useSnapStore();
  const [activeTab, setActiveTab] = useState("snap");
  const [myPageData, setMyPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [followListType, setFollowListType] = useState(null);
  const [followListData, setFollowListData] = useState([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const tabSectionRef = useRef(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUserId = urlUserId || user?.userId;
  const isMyPage = user?.userId === currentUserId;

  useEffect(() => {
    const loadMyPageData = async () => {
      if (!currentUserId) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        const response = await userService.getMyPageInfo(currentUserId);

        if (response.success) {
          setMyPageData(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        console.error("마이페이지 데이터 로드 실패:", err);
        setError("마이페이지 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadMyPageData();
  }, [currentUserId]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!isMyPage && currentUserId && user?.userId) {
        try {
          const response = await userService.checkFollowing(currentUserId);
          if (response.success) {
            setIsFollowing(response.data);
          }
        } catch (err) {
          console.error("팔로우 상태 확인 실패:", err);
        }
      }
    };
    checkFollowStatus();
  }, [isMyPage, currentUserId, user?.userId]);

  const handleMetricClick = (type) => {
    if (type === "posts") {
      tabSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setActiveTab("snap");
    } else if (type === "followers") {
      openFollowListModal("followers");
    } else if (type === "followings") {
      openFollowListModal("followings");
    }
  };

  const openFollowListModal = async (type) => {
    setIsFollowListModalOpen(true);
    setFollowListType(type);
    setFollowListLoading(true);

    try {
      const response =
        type === "followers"
          ? await userService.getFollowers(currentUserId)
          : await userService.getFollowings(currentUserId);

      if (response.success) {
        setFollowListData(response.data);
      } else {
        console.error("팔로우 목록 조회 실패:", response.message);
        setFollowListData([]);
      }
    } catch (error) {
      console.error("팔로우 목록 조회 오류:", error);
      setFollowListData([]);
    } finally {
      setFollowListLoading(false);
    }
  };

  const closeFollowListModal = () => {
    setIsFollowListModalOpen(false);
    setFollowListType(null);
    setFollowListData([]);
  };

  const handleFollowToggle = async () => {
    if (followLoading || !currentUserId) return;

    setFollowLoading(true);
    try {
      const response = await userService.toggleFollow(currentUserId);
      if (response.success) {
        setIsFollowing(!isFollowing);

        const myPageResponse = await userService.getMyPageInfo(currentUserId);
        if (myPageResponse.success) {
          setMyPageData(myPageResponse.data);
        }
      } else {
        setErrorMessage(response.message || "팔로우 처리에 실패했습니다.");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error("팔로우 처리 실패:", err);
      setErrorMessage("팔로우 처리 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/snap/${postId}`);
  };

  const handleProfileImageClick = () => {
    const profileImageUrl = myPageData?.profileImageUrl || profileImage;
    setSelectedImage(profileImageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const posts = useMemo(() => {
    if (!myPageData?.posts) return [];
    return myPageData.posts.map((post) => ({
      id: post.postId,
      imageUrl: post.imageUrl,
    }));
  }, [myPageData?.posts]);

  const likedPosts = useMemo(() => {
    if (!myPageData?.likedPosts) return [];
    return myPageData.likedPosts.map((post) => ({
      id: post.postId,
      imageUrl: post.imageUrl,
    }));
  }, [myPageData?.likedPosts]);

  const renderItems = useMemo(() => {
    switch (activeTab) {
      case "snap":
        return posts;
      case "liked":
        return likedPosts;
      default:
        return posts;
    }
  }, [activeTab, posts, likedPosts]);

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>마이페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>오류: {error}</p>
          <button onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!myPageData) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>사용자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles["profile-section-container"]}>
          <div className={styles["profile-section"]}>
            <div className={styles["profile-image"]} onClick={handleProfileImageClick}>
              <img src={myPageData.profileImageUrl || profileImage} alt="프로필" />
            </div>
            <div className={styles.summary}>
              <h2 className={styles.nickname}>{myPageData.nickname}</h2>
              <div className={styles.metrics}>
                <button type="button" onClick={() => handleMetricClick("posts")}>
                  <strong>{myPageData.postsCount?.toLocaleString() || 0}</strong>
                  <span>게시물</span>
                </button>
                <button type="button" onClick={() => handleMetricClick("followers")}>
                  <strong>{myPageData.followersCount?.toLocaleString() || 0}</strong>
                  <span>팔로워</span>
                </button>
                <button type="button" onClick={() => handleMetricClick("followings")}>
                  <strong>{myPageData.followingsCount?.toLocaleString() || 0}</strong>
                  <span>팔로잉</span>
                </button>
              </div>
            </div>
          </div>
          {/* 버튼 컨테이너 */}
          <div className={styles["button-container"]}>
            {isMyPage ? (
              <button
                type="button"
                className={styles["edit-button"]}
                onClick={() => navigate("/profile/edit")}
              >
                프로필 수정
              </button>
            ) : (
              <button
                type="button"
                className={`${styles["follow-button"]} ${isFollowing ? styles["following"] : ""}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? "처리중..." : isFollowing ? "팔로잉" : "팔로우"}
              </button>
            )}
          </div>
        </div>
      </section>
      <section ref={tabSectionRef} className={styles.gallery}>
        <Tabs tabs={getTabItems(isMyPage)} activeTab={activeTab} onChange={setActiveTab} />
        <div className={styles["image-grid"]}>
          {renderItems.map((item) => (
            <div
              key={item.id}
              className={styles["image-card"]}
              onClick={() => handlePostClick(item.id)}
              style={{ cursor: "pointer" }}
            >
              <img src={item.imageUrl} alt="코디" />
            </div>
          ))}
        </div>
      </section>
      {user?.userId === currentUserId && (
        <button
          className={styles["fab-button"]}
          onClick={() => {
            clearSnapData();
            navigate("/snap/add");
          }}
        >
          <span>+</span>
        </button>
      )}

      {isFollowListModalOpen && (
        <BottomSheet
          title={
            followListType === "followers"
              ? `팔로워 ${followListData.length}명`
              : `팔로잉 ${followListData.length}명`
          }
          onClose={closeFollowListModal}
          height="60vh"
        >
          <div className={styles.followListModalContent}>
            {followListLoading ? (
              <div className={styles.loadingFollowList}>
                <p>불러오는 중...</p>
              </div>
            ) : followListData.length > 0 ? (
              <div className={styles.followUserList}>
                {followListData.map((followUser, index) => (
                  <div
                    key={index}
                    className={styles.followUserItem}
                    onClick={() => {
                      closeFollowListModal();
                      navigate(`/mypage/${followUser.userId}`);
                    }}
                  >
                    <img
                      src={followUser.profileImageUrl || profileImage}
                      alt="프로필"
                      className={styles.followUserProfileImage}
                    />
                    <span className={styles.followUserNickname}>{followUser.nickname}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyFollowList}>
                <p>아직 {followListType === "followers" ? "팔로워" : "팔로잉"}가 없습니다.</p>
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* 이미지 확대 모달 */}
      {isImageModalOpen && (
        <div className={styles.imageModalOverlay} onClick={closeImageModal}>
          <div className={styles.imageModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.imageModalClose} onClick={closeImageModal}>
              ×
            </button>
            <img src={selectedImage} alt="확대 이미지" className={styles.imageModalImage} />
          </div>
        </div>
      )}

      {/* 오류 모달 */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="오류"
        message={errorMessage}
        confirmText="확인"
        cancelText=""
      />
    </div>
  );
};
export default MyPage;
