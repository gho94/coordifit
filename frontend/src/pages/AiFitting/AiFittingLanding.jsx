import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";

import styles from "./AiFittingLanding.module.css";
import {
  clothingTypes,
  closetCategoryMap,
  CLOTHING_CATEGORIES,
  transformClothesApiData,
  groupClothesByCategory,
} from "./data.js";
import { CLOTHING_ITEMS, MAIN_CATEGORIES } from "@/pages/ClosetPage/closetData";
import { useAiFittingStore } from "@/stores/aiFittingStore.js";
import { useUserStore } from "@/stores/userStore.js";
import clothesService from "@/services/clothesService";
import chevronDown from "@/assets/images/chevron-down.svg";
import userIcon from "@/assets/images/usericon.png";
import { requestAiFitting } from "@/services/avatars.js";
import { CATEGORIES } from "@/constants/category";
import ConfirmModal from "@/components/ConfirmModal";

const AiFittingLanding = () => {
  const navigate = useNavigate();
  const avatars = useAiFittingStore((state) => state.avatars);
  const selectedAvatarId = useAiFittingStore((state) => state.selectedAvatarId);
  const clothingSelection = useAiFittingStore((state) => state.clothingSelection);
  const updateClothingSelection = useAiFittingStore((state) => state.updateClothingSelection);
  const loadAvatars = useAiFittingStore((state) => state.loadAvatars);
  const hasLoadedAvatars = useAiFittingStore((state) => state.hasLoadedAvatars);
  const resetAiFittingState = useAiFittingStore((state) => state.resetAiFittingState);
  const { targetCoordiId, setTargetCoordiId } = useAiFittingStore();
  const user = useUserStore((state) => state.user);
  const loadUserFromToken = useUserStore((state) => state.loadUserFromToken);
  const userId = user?.userId;
  const [activeClothingType, setActiveClothingType] = useState(null);
  const [activeSubCategory, setActiveSubCategory] = useState("all");
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [myClothes, setMyClothes] = useState([]);
  const [groupedClothes, setGroupedClothes] = useState({ top: [], bottom: [], shoes: [] });
  const [isLoadingClothes, setIsLoadingClothes] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestAbortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const prefetchedAvatarIdsRef = useRef(new Set());
  const lastFetchedUserIdRef = useRef(null);

  const selectedAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === selectedAvatarId) ?? null,
    [avatars, selectedAvatarId],
  );

  const location = useLocation();

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 상태 초기화
      const nextPath = window.location.pathname;
      if (nextPath.startsWith("/ai-fitting/avatars")) {
        return;
      }
      resetAiFittingState();
    };
  }, [resetAiFittingState]);

  useEffect(() => {
    if (!user) {
      loadUserFromToken();
    }
  }, [loadUserFromToken, user]);

  useEffect(() => {
    if (!userId) return;

    if (!hasLoadedAvatars || lastFetchedUserIdRef.current !== userId) {
      lastFetchedUserIdRef.current = userId;

      loadAvatars().catch(() => {
        lastFetchedUserIdRef.current = null;
        // 에러는 AvatarSelectionPage에서 안내
      });
    }
  }, [hasLoadedAvatars, loadAvatars, userId]);

  // 옷 데이터 로드
  useEffect(() => {
    const loadClothes = async () => {
      if (!userId) return;

      setIsLoadingClothes(true);
      try {
        const response = await clothesService.getUserClothes();

        if (response.success && response.data) {
          const transformedClothes = transformClothesApiData(response.data);
          const grouped = groupClothesByCategory(transformedClothes);
          setMyClothes(transformedClothes);
          setGroupedClothes(grouped);
        } else {
          setMyClothes([]);
          setGroupedClothes({ top: [], bottom: [], shoes: [] });
        }
      } catch (error) {
        console.error("옷 데이터 로드 실패:", error);
        // 에러가 발생해도 빈 배열로 설정
        setMyClothes([]);
        setGroupedClothes({ top: [], bottom: [], shoes: [] });
      } finally {
        setIsLoadingClothes(false);
      }
    };

    loadClothes();
  }, [userId]);

  useEffect(() => {
    const locatedData = location.state;

    if (!locatedData) return;

    if (locatedData.clothesItems) {
      const validCategories = ["B20001", "B20002", "B20003"];

      const filteredCategoryData = locatedData.clothesItems.filter((item) =>
        validCategories.includes(CATEGORIES[item.categoryCode].parent),
      );

      if (filteredCategoryData.length !== 0 && myClothes.length !== 0) {
        const clothesMap = new Map(myClothes.map((item) => [item.id, item]));

        const transData = filteredCategoryData.map((clothes) => clothesMap.get(clothes.clothesId));

        transData.forEach((addTarget) => {
          updateClothingSelection(addTarget.category, addTarget);
        });
      }
    }

    if (locatedData.coordiId) {
      setTargetCoordiId(locatedData.coordiId);
    }
  }, [location.state, updateClothingSelection, myClothes]);

  useEffect(() => {
    if (!avatars.length) return;

    const newImages = [];

    avatars.forEach((avatar) => {
      if (!avatar.imageUrl || prefetchedAvatarIdsRef.current.has(avatar.id)) return;

      const image = new Image();
      image.decoding = "async";
      image.src = avatar.imageUrl;
      prefetchedAvatarIdsRef.current.add(avatar.id);
      newImages.push(image);
    });

    return () => {
      newImages.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [avatars]);

  const currentClosetMainCategory = useMemo(() => {
    if (!activeClothingType) return null;
    return CLOTHING_CATEGORIES[activeClothingType] || null;
  }, [activeClothingType]);

  const availableClosetItems = useMemo(() => {
    if (!activeClothingType) return [];
    return groupedClothes[activeClothingType] || [];
  }, [activeClothingType, groupedClothes]);

  const filteredClosetItems = useMemo(() => {
    if (!activeClothingType) return [];
    if (activeSubCategory === "all") return availableClosetItems;
    return availableClosetItems.filter((item) => item.subCategory === activeSubCategory);
  }, [activeClothingType, activeSubCategory, availableClosetItems]);

  const isReadyForAi = Boolean(selectedAvatar) && Object.values(clothingSelection).some(Boolean);

  useEffect(
    () => () => {
      isMountedRef.current = false;

      if (requestAbortControllerRef.current) {
        requestAbortControllerRef.current.abort();
      }
    },
    [],
  );

  const handleAvatarClick = () => {
    navigate("/ai-fitting/avatars");
  };

  const handleTypeCardClick = (typeId) => {
    if (activeClothingType === typeId) {
      setActiveClothingType(null);
      setActiveSubCategory("all");
      setHighlightedItem(null);
      return;
    }

    setActiveClothingType(typeId);
    setActiveSubCategory("all");
    setHighlightedItem(clothingSelection[typeId] ?? null);
  };

  const handleClosetItemClick = (item) => {
    setHighlightedItem(item);
  };

  const handleConfirmSelection = () => {
    if (!activeClothingType || !highlightedItem) return;

    updateClothingSelection(activeClothingType, highlightedItem);
    setActiveClothingType(null);
    setActiveSubCategory("all");
    setHighlightedItem(null);
  };

  const showClosetPanel = Boolean(activeClothingType && currentClosetMainCategory);

  const handleStartAi = async () => {
    if (!isReadyForAi || isGenerating) return;

    const payload = {
      avatarImage: selectedAvatar?.imageUrl ?? null,
      topImage: clothingSelection.top?.images?.[0] ?? null,
      bottomImage: clothingSelection.bottom?.images?.[0] ?? null,
      shoesImage: clothingSelection.shoes?.images?.[0] ?? null,
    };

    setIsGenerating(true);

    if (requestAbortControllerRef.current) {
      requestAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    requestAbortControllerRef.current = controller;

    try {
      const response = await requestAiFitting(payload, {
        signal: controller.signal,
      });

      const imageBase64 = response?.data?.imageBase64 ?? null;
      const durationMs = response?.data?.durationMs ?? null;

      navigate("/ai-fitting/result", {
        state: {
          imageBase64,
          durationMs,
          selectedAvatarId,
          clothingSelection,
          selectedAvatar: avatars.find((avatar) => avatar.id === selectedAvatarId),
          ...(targetCoordiId && { targetCoordiId }),
        },
      });
    } catch (error) {
      if (error?.code === "ERR_CANCELED") {
        return;
      }

      console.error("AI fitting 요청 중 오류가 발생했습니다:", error);
      setErrorMessage("AI 옷입히기 요청 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
      setShowErrorModal(true);
    } finally {
      if (requestAbortControllerRef.current === controller) {
        requestAbortControllerRef.current = null;
      }

      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <section className={styles.avatarSection}>
          {selectedAvatar ? (
            // ✅ 아바타 선택된 경우 → 큰 이미지
            <button
              type="button"
              className={styles.avatarPreviewButton}
              onClick={handleAvatarClick}
              aria-label="아바타 변경"
            >
              <img
                src={selectedAvatar.imageUrl}
                alt={selectedAvatar.name}
                className={styles.avatarPreviewImage}
              />
            </button>
          ) : (
            // ✅ 선택 안 된 경우 → placeholder + 텍스트 + 버튼 (피그마 스타일)
            <div className={styles.avatarPanel}>
              <div className={styles.avatarPlaceholderWrapper}>
                <img
                  src={userIcon}
                  alt="avatar placeholder"
                  className={styles.avatarPlaceholderIcon}
                />
              </div>
              <h2 className={styles.avatarHeading}>
                아바타를 선택하거나
                <br />
                만들어보세요
              </h2>
              <button
                type="button"
                className={styles.avatarAction}
                onClick={() => navigate("/ai-fitting/avatars")}
              >
                아바타 선택
              </button>
            </div>
          )}
        </section>

        <section className={styles.selectionSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>의류 선택</h2>
            {showClosetPanel && (
              <button
                type="button"
                className={styles.backToSelectionButton}
                onClick={() => {
                  setActiveClothingType(null);
                  setActiveSubCategory("all");
                  setHighlightedItem(null);
                }}
              >
                다시 선택
              </button>
            )}
          </div>

          {!showClosetPanel && (
            <div className={styles.selectionList}>
              {clothingTypes.map((type) => {
                const selection = clothingSelection[type.id];
                const isActive = activeClothingType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    className={clsx(styles.selectionCard, isActive && styles.selectionCardActive)}
                    onClick={() => handleTypeCardClick(type.id)}
                  >
                    {selection ? (
                      <div className={styles.selectionThumbnailWrapper}>
                        <img
                          src={selection.images?.[0]}
                          alt={selection.name}
                          className={styles.selectionThumbnail}
                        />
                      </div>
                    ) : (
                      <div className={styles.selectionIconWrapper}>
                        <img src={type.icon} alt="" className={styles.selectionIcon} />
                      </div>
                    )}
                    <div className={styles.selectionInfo}>
                      <span className={styles.selectionLabel}>{type.label}</span>
                      <span className={styles.selectionSummary}>
                        {selection ? selection.name : "선택된 아이템: 없음"}
                      </span>
                    </div>
                    <img
                      src={chevronDown}
                      alt=""
                      className={clsx(
                        styles.selectionChevronIcon,
                        isActive && styles.selectionChevronIconActive,
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {showClosetPanel && (
            <div className={styles.closetPanel}>
              <div className={styles.categoryTabs}>
                <div className={styles.subCategoryTabs}>
                  {currentClosetMainCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      className={clsx(
                        styles.subCategoryButton,
                        activeSubCategory === sub.id && styles.subCategoryButtonActive,
                      )}
                      onClick={() => setActiveSubCategory(sub.id)}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingClothes ? (
                <p className={styles.emptyState}>옷을 불러오는 중...</p>
              ) : filteredClosetItems.length > 0 ? (
                <div className={styles.closetGrid}>
                  {filteredClosetItems.map((item) => {
                    const isSelected = highlightedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={clsx(styles.closetCard, isSelected && styles.closetCardSelected)}
                        onClick={() => handleClosetItemClick(item)}
                      >
                        <div className={styles.closetThumbnail}>
                          <img
                            src={item.images?.[0]}
                            alt={item.name}
                            className={styles.closetImage}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.emptyState}>선택 가능한 아이템이 없습니다.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <div className={styles.bottomArea}>
        {!showClosetPanel && (
          <button
            type="button"
            className={styles.footerButton}
            onClick={handleStartAi}
            disabled={!isReadyForAi || isGenerating}
          >
            {isGenerating ? "AI 분석 중…" : "AI 옷입히기"}
          </button>
        )}

        {showClosetPanel && (
          <button
            type="button"
            className={styles.confirmButtonBottom}
            onClick={handleConfirmSelection}
            disabled={!highlightedItem || !activeClothingType}
          >
            옷 고르기
          </button>
        )}
      </div>

      {isGenerating && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingContent}>
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <p className={styles.loadingMessage}>AI가 코디를 준비하고 있어요…</p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="오류"
        message={errorMessage}
        confirmText="확인"
        cancelText=""
        variant="default"
      />
    </div>
  );
};

export default AiFittingLanding;
