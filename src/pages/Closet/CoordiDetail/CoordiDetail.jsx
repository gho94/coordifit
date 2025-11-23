import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { TbShirt } from "react-icons/tb";
import classNames from "classnames/bind";
import { useQueryClient } from "@tanstack/react-query";

import ItemCarousel from "@/components/ItemCarousel/ItemCarousel";
import Button from "@/components/Button/Button";
import DescriptionBox from "@/pages/Calendar/DescriptionBox/DescriptionBox";
import TitleBox from "@/pages/Closet/TitleBox/TitleBox";

import { useCoordiByIdQuery } from "@/hooks/useCoordiQuery";
import { deleteCoordi } from "@/services/coordiService";

import styles from "./CoordiDetail.module.css";
import aiIcon from "@/assets/icons/samsung_ai.webp";
import ConfirmModal from "@/components/ConfirmModal";

const cx = classNames.bind(styles);

const CoordiDetail = () => {
  const navigate = useNavigate();
  const { coordiId } = useParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("coordi");
  const [isLoading, setIsLoading] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: coordi = { data: [] } } = useCoordiByIdQuery(coordiId);

  const aiExists = Boolean(coordi.data?.aiImageUrl);

  useEffect(() => {
    if (aiExists && coordi?.data?.aiImageUrl) {
      setIsLoading(true);
    }
  }, [coordi?.data?.aiImageUrl, aiExists]);

  const handleEditClick = () => {
    navigate(`/closet/coordi/editor/${coordiId}`);
  };

  const handleAIFitClick = () => {
    const clothesItems = JSON.parse(coordi.data.canvasJson).map((obj) => ({
      clothesId: obj.clothesId,
      imageUrl: obj.imageUrl,
      name: obj.name,
      categoryCode: obj.categoryCode,
    }));

    navigate("/ai-fitting", {
      state: {
        coordiId: coordiId,
        clothesItems: clothesItems,
      },
    });
  };

  const handleDeleteClick = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleConfirm = async () => {
    if (!coordi) {
      setErrorMessage("삭제할 코디가 없습니다.");
      setShowErrorModal(true);
      return;
    } else {
      await deleteCoordi(coordiId);

      queryClient.invalidateQueries(["coordi", coordiId]);
      queryClient.invalidateQueries(["coordis"]);

      navigate("/closet", { state: { isCoordiTab: true } });
    }
  };

  return (
    <div className={cx("container")}>
      <div classname={cx("header-wapper")}>
        <div className={cx("content-header")}>
          <div className={cx("header-left")}>
            <label htmlFor="coordiName" className={cx("inputLabel")}>
              코디 제목
            </label>
            <TitleBox title={coordi?.data?.coordiName} />
          </div>
          <div className={cx("view-toggle-wrapper")}>
            <div className={cx("view-toggle")} role="tablist" aria-label="보기 전환">
              <button
                role="tab"
                aria-selected={viewMode === "coordi"}
                className={cx("toggle-option", viewMode === "coordi" && "active")}
                onClick={() => setViewMode("coordi")}
                title="코디 아이템 보기"
              >
                <TbShirt className={cx("toggle-icon")} />
                <span className={cx("span")}>코디</span>
              </button>

              <button
                role="tab"
                aria-selected={viewMode === "ai"}
                className={cx(
                  "toggle-option",
                  "toggle-ai",
                  viewMode === "ai" && "active",
                  !aiExists && "empty", // 시각적으로 '없음' 상태 표시
                )}
                onClick={() => setViewMode("ai")}
                title={aiExists ? "AI 피팅 이미지 보기" : "AI 피팅하러 가기"}
              >
                <img src={aiIcon} className={cx("toggle-icon")} />
                <span className={cx("span")}>AI 피팅</span>

                {aiExists ? (
                  <span className={cx("ai-badge", "ok")}>완료</span>
                ) : (
                  <span className={cx("ai-badge", "none")}>없음</span>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className={cx("header-left")}>
          <label htmlFor="coordiName" className={cx("inputLabel")}>
            코디 설명
          </label>
          <DescriptionBox description={coordi?.data?.description} />
        </div>
      </div>

      {viewMode === "coordi" ? (
        <>
          <div className={cx("wrapper")}>
            <img
              className={cx("image")}
              src={coordi?.data?.originImageUrl}
              alt="코디 원본 이미지"
            />
          </div>
          <ItemCarousel
            items={(() => {
              try {
                return JSON.parse(coordi?.data?.canvasJson || "[]");
              } catch {
                return [];
              }
            })()}
            onClick={(clothesId) => navigate(`/closet/item/${clothesId}`)}
          />
        </>
      ) : (
        <>
          <div className={cx("wrapper", !aiExists && "empty-ai")}>
            {aiExists ? (
              <>
                {isLoading && (
                  <div className={cx("loadingOverlay")}>
                    <div className={cx("loadingBox")}>
                      <div className={cx("spinner")}></div>
                      <p className={cx("loadingText")}>AI 이미지 불러오는 중...</p>
                    </div>
                  </div>
                )}
                <img
                  className={cx("image")}
                  src={coordi?.data?.aiImageUrl}
                  alt="AI 피팅 결과"
                  onLoad={() => setIsLoading(false)} // ✅ 이미지 로드 완료 시 숨김
                  onError={() => setIsLoading(false)} // 에러 시에도 숨김
                  style={{ display: isLoading ? "none" : "block" }} // 로딩 중엔 숨김
                />
              </>
            ) : (
              <button className={cx("cta-button")} onClick={handleAIFitClick}>
                <img src={aiIcon} className={cx("cta-icon")} />
                <span>AI 이미지 생성하러 가기</span>
              </button>
            )}
          </div>
          {/* 캐러셀 자리 고정 */}
          <div className={cx("carousel-slot")} />
        </>
      )}

      <div className={cx("button-wrapper")}>
        {viewMode === "coordi" ? (
          <>
            <Button onClick={handleEditClick} style="default">
              수정하기
            </Button>
            <Button onClick={handleDeleteClick} style="secondary">
              삭제하기
            </Button>
            <ConfirmModal
              isOpen={isOpen}
              onClose={handleClose}
              onConfirm={handleConfirm}
              title="삭제 확인"
              message="이 코디를 삭제하시겠습니까?"
              confirmText="삭제"
              cancelText="취소"
              variant="danger" // ✅ 강조 색상 (짙은 회색 등)
            />
          </>
        ) : (
          aiExists && (
            <>
              <Button onClick={() => setViewMode("coordi")} style="secondary">
                아이템 보기
              </Button>
              <Button onClick={handleAIFitClick} style="default">
                다시 피팅하기
              </Button>
            </>
          )
        )}
      </div>

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

export default CoordiDetail;
