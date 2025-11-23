import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./AiFittingResultPage.module.css";
import { useAiFittingStore } from "@/stores/aiFittingStore";
import autoAwesomeIcon from "@/assets/images/auto_awesome.png";
import { requestFittingAnalysis } from "@/services/avatars.js";
import { api } from "@/services/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";

const fallbackResultImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80";

const formatPrice = (value) => {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("ko-KR").format(value);
};

const AiFittingResultPage = () => {
  const navigate = useNavigate();
  const avatars = useAiFittingStore((state) => state.avatars);
  const selectedAvatarId = useAiFittingStore((state) => state.selectedAvatarId);
  const clothingSelection = useAiFittingStore((state) => state.clothingSelection);
  const resetAiFittingState = useAiFittingStore((state) => state.resetAiFittingState);
  const { targetCoordiId, setTargetCoordiId, resetTargetCoordiId } = useAiFittingStore();
  const [isLoading, setIsLoading] = useState();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location.state?.targetCoordiId && !targetCoordiId) {
      setTargetCoordiId(location.state.targetCoordiId);
    }
  }, [location.state]);

  // ✅ data 혹은 imageBase64 둘 다 대응
  const imageBase64 = location.state?.imageBase64 || location.state?.data?.imageBase64 || null;

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const analysisAbortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const selectedAvatar = useMemo(() => {
    // navigation state에서 전달된 아바타 정보 우선 사용
    if (location.state?.selectedAvatar) {
      return location.state.selectedAvatar;
    }
    // 그 다음 store에서 조회
    return avatars.find((avatar) => avatar.id === selectedAvatarId) ?? null;
  }, [avatars, selectedAvatarId, location.state?.selectedAvatar]);

  const selectedItems = useMemo(() => {
    // navigation state에서 전달된 의류 선택 정보 우선 사용
    const clothingData = location.state?.clothingSelection || clothingSelection;

    return Object.entries(clothingData)
      .filter(([, item]) => Boolean(item))
      .map(([type, item]) => ({
        type,
        ...item,
      }));
  }, [clothingSelection, location.state?.clothingSelection]);

  useEffect(() => {
    console.log("🔍 AiFittingResultPage 상태 체크:", {
      selectedAvatar: !!selectedAvatar,
      selectedItems: selectedItems.length,
      fromState: !!location.state?.selectedAvatar,
      fromStore: !!avatars.find((avatar) => avatar.id === selectedAvatarId),
      clothingFromState: !!location.state?.clothingSelection,
      clothingFromStore: Object.keys(clothingSelection).length,
    });

    if (!selectedAvatar || selectedItems.length === 0) {
      console.warn("⚠️ 아바타 또는 의류 선택이 없습니다. /ai-fitting 으로 리다이렉트");
      navigate("/ai-fitting");
    }
  }, [
    navigate,
    selectedAvatar,
    selectedItems,
    location.state,
    avatars,
    selectedAvatarId,
    clothingSelection,
  ]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
      }
    },
    [],
  );

  const handleRetry = () => {
    resetAiFittingState();
    navigate("/ai-fitting");
  };

  const outfitSummary = useMemo(() => selectedItems.map((item) => item.name), [selectedItems]);

  const resultImageSrc = useMemo(() => {
    if (!imageBase64) return fallbackResultImage;
    return imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`;
  }, [imageBase64]);
  console.log("🧠 imageBase64 전달 상태", {
    hasImage: !!imageBase64,
    length: imageBase64?.length,
    preview: imageBase64?.slice(0, 60),
  });
  useEffect(() => {
    // ⛔ 분석 토글이 꺼져있으면 요청 중단
    if (!showAnalysis) return;
    // ⛔ 이미지가 없으면 요청 불가
    if (!imageBase64) return;

    console.log("🚀 AI 분석 요청 시작", {
      showAnalysis,
      hasImageBase64: !!imageBase64,
      preview: imageBase64?.slice(0, 40),
    });

    const controller = new AbortController();
    analysisAbortControllerRef.current = controller;

    // ✅ 요청 직전 초기화
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisData(null);

    const fetchAnalysis = async () => {
      try {
        const response = await requestFittingAnalysis(
          {
            imageBase64: imageBase64.startsWith("data:")
              ? imageBase64
              : `data:image/png;base64,${imageBase64}`,
            hint: Array.isArray(outfitSummary) ? outfitSummary.join(" / ") : outfitSummary || "",
          },
          { signal: controller.signal },
        );

        console.log("✅ AI 분석 응답 수신:", response);

        // ✅ 구조분해 (ApiResponseDto 대응)
        const { success, message, data } = response ?? {};
        if (!success || !data) {
          console.error("❌ AI 분석 응답 구조가 예상과 다름:", response);
          setAnalysisError(new Error("AI 분석 응답이 올바르지 않습니다."));
          return;
        }

        const result = data; // 실제 분석 결과 DTO

        const normalizedTitle =
          typeof result?.title === "string" && result.title.trim().length > 0
            ? result.title.trim()
            : null;

        const normalizedAnalysis = Array.isArray(result?.contents)
          ? result.contents.join("\n")
          : typeof result?.analysis === "string"
            ? result.analysis.trim()
            : null;

        const normalizedHashtags = Array.isArray(result?.hashtags)
          ? result.hashtags
              .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
              .filter(Boolean)
              .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
          : [];

        // ✅ 정상 수신 → 상태 반영
        setAnalysisData({
          title: normalizedTitle,
          analysis: normalizedAnalysis,
          hashtags: normalizedHashtags,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED") {
          console.log("⚠️ 요청 취소됨");
          return;
        }
        console.error("❌ AI 분석 요청 중 오류 발생:", error);
        setAnalysisError(error);
      } finally {
        setIsLoadingAnalysis(false);
        analysisAbortControllerRef.current = null;
      }
    };

    fetchAnalysis();

    // cleanup 시점에서는 실행 중인 요청만 취소
    return () => {
      if (analysisAbortControllerRef.current) {
        console.log("🧹 분석 요청 중단 (cleanup)");
        analysisAbortControllerRef.current.abort();
        analysisAbortControllerRef.current = null;
      }
    };
  }, [showAnalysis, imageBase64, outfitSummary]);

  const handleToggleAnalysis = () => {
    setShowAnalysis((prev) => {
      const next = !prev;
      if (!next) {
        if (analysisAbortControllerRef.current) {
          analysisAbortControllerRef.current.abort();
          analysisAbortControllerRef.current = null;
        }
        setAnalysisData(null);
        setAnalysisError(null);
      }
      return next;
    });
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.main}>
        <div className={styles.resultImageWrapper} onClick={handleImageClick}>
          <img src={resultImageSrc} alt="AI로 생성된 코디 결과" className={styles.resultImage} />
        </div>

        <div className={styles.avatarInfo}>
          <span className={styles.avatarName}>{selectedAvatar?.name ?? "선택된 아바타 없음"}</span>
          {outfitSummary?.length > 0 && (
            <div className={styles.outfitSummary}>
              {outfitSummary.slice(0, 3).map((name, idx, arr) => {
                const basis = arr.length === 1 ? "100%" : arr.length === 2 ? "50%" : "33.33%";
                return (
                  <span key={idx} className={styles.outfitItem} style={{ flexBasis: basis }}>
                    {name}
                    {idx < arr.length - 1 && <span className={styles.outfitSlash}> / </span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={async () => {
              setIsLoading(true);
              try {
                if (targetCoordiId) {
                  const cleanBase64 = imageBase64.replace(/\s+/g, "");
                  const dataUrl = `data:image/png;base64,${cleanBase64}`;

                  await api.put(`/coordi/${targetCoordiId}/ai-image`, { dataUrl });
                  queryClient.invalidateQueries(["coordi", targetCoordiId]);
                  navigate(`/closet/coordi/${targetCoordiId}`);
                } else {
                  const fittingItems = Object.values(location.state.clothingSelection).filter(
                    (obj) => !!obj,
                  );

                  navigate("/closet/coordi/editor", {
                    state: {
                      clothesItems: fittingItems,
                      dataUrl: imageBase64,
                    },
                  });
                }
              } catch (error) {
                console.error(error);
              } finally {
                resetTargetCoordiId();
                setIsLoading(false);
              }
            }}
          >
            코디에 저장하기
          </button>
          <button type="button" className={styles.retryButton} onClick={handleRetry}>
            다른 옷 입히기
          </button>
        </div>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingBox}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>이미지를 저장 중입니다...</p>
            </div>
          </div>
        )}
        <button
          type="button"
          className={`${styles.analysisToggle} ${showAnalysis ? styles.active : ""}`}
          onClick={handleToggleAnalysis}
          aria-expanded={showAnalysis}
        >
          <img src={autoAwesomeIcon} alt="" className={styles.analysisIcon} aria-hidden="true" />
          <span className={styles.analysisToggleLabel}>
            {showAnalysis ? "AI 분석 결과" : "AI 분석"}
          </span>
        </button>

        {showAnalysis && (
          <article className={styles.analysisPanel}>
            {isLoadingAnalysis && (
              <>
                <h3 className={styles.analysisTitle}>AI 분석 중...</h3>
                <p className={styles.analysisDescription}>AI가 코디를 분석하고 있습니다...</p>
              </>
            )}

            {!isLoadingAnalysis && analysisError && (
              <p className={styles.analysisError}>AI 분석 결과를 불러오지 못했어요.</p>
            )}

            {!isLoadingAnalysis && analysisData && (
              <div className={styles.analysisContent}>
                <h3 className={styles.analysisTitle}>{analysisData.title}</h3>

                <ul className={styles.analysisList}>
                  {analysisData.analysis
                    ?.split("\n")
                    .filter((line) => line.trim().length > 0)
                    .map((line, index) => (
                      <li key={index} className={styles.analysisBullet}>
                        {line}
                      </li>
                    ))}
                </ul>

                {analysisData.hashtags?.length > 0 && (
                  <div className={styles.hashtagGroup}>
                    {analysisData.hashtags.map((tag) => (
                      <span key={tag} className={styles.hashtagBadge}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        )}

        <h3 className={styles.productHeading}>착용 상품 정보</h3>
        <div className={styles.productList}>
          {selectedItems.map((item) => {
            const price = formatPrice(item.apiData.price);
            return (
              <article key={item.id ?? item.name} className={styles.productCard}>
                <div className={styles.productThumbnail}>
                  <img
                    src={item.images?.[0] ?? fallbackResultImage}
                    alt={item.name}
                    className={styles.productImage}
                  />
                </div>
                <div className={styles.productMeta}>
                  <div className={styles.productMetaHeader}>
                    {item.apiData.brand && (
                      <span className={styles.productBrand}>{item.apiData.brand}</span>
                    )}
                  </div>
                  <span className={styles.productName}>{item.name}</span>
                  {price && <span className={styles.productPrice}>{price}원</span>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 이미지 확대 모달 */}
      {isImageModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img
              src={resultImageSrc}
              alt="AI로 생성된 코디 결과 (확대)"
              className={styles.modalImage}
            />
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={handleCloseModal}
              aria-label="모달 닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiFittingResultPage;
