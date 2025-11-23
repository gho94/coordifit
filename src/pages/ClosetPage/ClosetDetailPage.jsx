import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import styles from "./ClosetDetailPage.module.css";
import ChevronDown from "@/assets/images/chevron-down.svg";
import clothesService from "@/services/clothesService";
import CommonCodeService from "@/services/commonCodeService";
import TopIcon from "@/assets/images/topicon.png";
import BottomIcon from "@/assets/images/bottomicon.png";
import ShoesIcon from "@/assets/images/shoesicon.png";
import OuterIcon from "@/assets/images/outericon.png";
import AccessoriesIcon from "@/assets/images/accessoriesicon.png";
import { useQueryClient } from "@tanstack/react-query";
import ImagePlusIcon from "@/assets/images/imageplusicon.png";
import ConfirmModal from "@/components/ConfirmModal";

const ClosetDetailPage = () => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const queryClient = useQueryClient();

  const [mainCategories, setMainCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const CATEGORY_ICON_MAP = {
    상의: TopIcon,
    하의: BottomIcon,
    신발: ShoesIcon,
    아우터: OuterIcon,
    패션소품: AccessoriesIcon,
  };

  // 카테고리 데이터 로드
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const { mainCategories, subCategoriesMap } = await CommonCodeService.getCategoryData();
        setMainCategories(mainCategories);
        setSubCategoriesMap(subCategoriesMap);
      } catch (err) {
        console.error("카테고리 데이터 로드 실패:", err);
      }
    };
    fetchCategoryData();
  }, []);

  // 옷 상세 데이터 로드
  useEffect(() => {
    const fetchClothesDetail = async () => {
      try {
        setLoading(true);
        const response = await clothesService.getClothesDetail(itemId);
        console.log("옷 상세 응답:", response);
        if (response.success && response.data) {
          setItem(response.data);
        } else {
          console.error("옷 상세 조회 실패:", response.message);
          setErrorMessage("옷 정보를 불러오는데 실패했습니다.");
          setShowErrorModal(true);
          setTimeout(() => navigate("/closet"), 2000);
        }
      } catch (err) {
        console.error("옷 상세 조회 실패:", err);
        setErrorMessage("옷 정보를 불러오는데 실패했습니다.");
        setShowErrorModal(true);
        setTimeout(() => navigate("/closet"), 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchClothesDetail();
  }, [itemId, navigate]);

  const handleImageScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const imageWidth = e.target.scrollWidth / (item?.images?.length || 1);
    const newIndex = Math.round(scrollLeft / imageWidth);
    setCurrentIndex(newIndex);
  };

  // 컴포넌트 언마운트 시 blob URL 정리
  useEffect(() => {
    return () => {
      item?.images?.forEach((img) => {
        if (!img.fileId && img.url && img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [item]);

  const handleCategorySelect = (mainId, subId) => {
    setItem((prev) => ({
      ...prev,
      categoryMain: mainId,
      categoryCode: subId,
    }));
    setIsCategorySheetOpen(false);
  };

  const handleRemoveImage = (idx) => {
    const imageToDelete = item.images[idx];

    // 기존 이미지인 경우 (fileId 있음) - 삭제 목록에 추가
    if (imageToDelete.fileId) {
      setDeletedFileIds((prev) => [...prev, imageToDelete.fileId]);
    }

    // 새로 추가한 이미지인 경우 (fileId 없음) - newFiles에서도 제거
    if (!imageToDelete.fileId) {
      // URL 해제
      if (imageToDelete.url && imageToDelete.url.startsWith("blob:")) {
        URL.revokeObjectURL(imageToDelete.url);
      }

      // newFiles 배열에서 제거 (순서 기반)
      const newImageIndex = item.images.slice(0, idx).filter((img) => !img.fileId).length;
      setNewFiles((prev) => prev.filter((_, i) => i !== newImageIndex));
    }

    // 로컬 상태에서 제거
    setItem((prev) => {
      if (!prev?.images) return prev;
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== idx),
      };
    });
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      // 수정 저장 전 유효성 검사
      if (!item.name || item.name.trim().length === 0) {
        setErrorMessage("이름을 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.name.trim().length > 100) {
        setErrorMessage("이름은 100자 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (!item.categoryCode) {
        setErrorMessage("카테고리를 선택해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (!item.brand || item.brand.trim().length === 0) {
        setErrorMessage("브랜드를 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.brand.trim().length > 100) {
        setErrorMessage("브랜드는 100자 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.clothesSize && item.clothesSize.length > 20) {
        setErrorMessage("사이즈는 20자 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.price && item.price.toString().length > 10) {
        setErrorMessage("가격은 10자리 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.purchaseUrl && item.purchaseUrl.length > 1000) {
        setErrorMessage("구매링크는 1000자 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      if (item.description && item.description.length > 1000) {
        setErrorMessage("설명은 1000자 이내로 입력해주세요.");
        setShowErrorModal(true);
        return;
      }

      // 수정 저장
      try {
        const updateData = {
          name: item.name,
          brand: item.brand,
          categoryCode: item.categoryCode,
          clothesSize: item.clothesSize,
          price: item.price,
          purchaseDate: item.purchaseDate,
          purchaseUrl: item.purchaseUrl,
          description: item.description,
          deletedFileIds: deletedFileIds, // 삭제할 이미지 fileId 목록
          files: newFiles, // 새로 추가할 이미지 파일
        };

        queryClient.invalidateQueries(["clothes"]);
        queryClient.invalidateQueries(["coordis"]);
        queryClient.invalidateQueries(["coordi"]);

        const response = await clothesService.updateClothes(itemId, updateData);

        if (response.success) {
          setErrorMessage("수정이 완료되었습니다.");
          setShowErrorModal(true);
          setIsEditing(false);
          setDeletedFileIds([]); // 삭제 목록 초기화
          setNewFiles([]); // 새 파일 목록 초기화

          // 새로 추가한 이미지 URL 해제
          item.images?.forEach((img) => {
            if (!img.fileId && img.url && img.url.startsWith("blob:")) {
              URL.revokeObjectURL(img.url);
            }
          });

          // 데이터 새로고침
          const detailResponse = await clothesService.getClothesDetail(itemId);
          if (detailResponse.success && detailResponse.data) {
            setItem(detailResponse.data);
          }
        } else {
          setErrorMessage("수정에 실패했습니다: " + response.message);
          setShowErrorModal(true);
        }
      } catch (error) {
        console.error("수정 오류:", error);
        setErrorMessage("수정 중 오류가 발생했습니다.");
        setShowErrorModal(true);
      }
    } else {
      // 편집 모드 시작
      setIsEditing(true);
      setDeletedFileIds([]);
      setNewFiles([]);
    }
  };

  // 편집 취소 핸들러 추가
  const handleCancelEdit = () => {
    // 새로 추가한 이미지 URL 해제
    item?.images?.forEach((img) => {
      if (!img.fileId && img.url && img.url.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });

    // 상태 초기화 및 데이터 새로고침
    setIsEditing(false);
    setDeletedFileIds([]);
    setNewFiles([]);

    // 원본 데이터 다시 로드
    const fetchClothesDetail = async () => {
      try {
        const response = await clothesService.getClothesDetail(itemId);
        if (response.success && response.data) {
          setItem(response.data);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    };
    fetchClothesDetail();
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    try {
      const response = await clothesService.deleteClothes(itemId);

      if (response.success) {
        setErrorMessage("옷이 삭제되었습니다.");
        setShowErrorModal(true);
        queryClient.invalidateQueries(["coordis"]);
        // 모달 확인 후 navigate 하도록 setTimeout 사용
        setTimeout(() => {
          navigate("/closet");
        }, 2000);
      } else {
        setErrorMessage("삭제에 실패했습니다: " + response.message);
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      setErrorMessage("삭제 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    }
  };

  const handleFieldChange = (field, value) => {
    setItem((prev) => ({ ...prev, [field]: value }));
  };

  const getCategoryLabel = () => {
    if (!item?.categoryCode) return "-";

    for (const mainCat of mainCategories) {
      const subCats = subCategoriesMap[mainCat.codeId] || [];
      const subCat = subCats.find((sub) => sub.codeId === item.categoryCode);
      if (subCat) {
        return `${mainCat.codeName} / ${subCat.codeName}`;
      }
    }
    return "-";
  };

  const categoryLabel = getCategoryLabel();

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>옷 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 아이템이 없는 경우
  if (!item) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>옷 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.content}>
        {/* 이미지 영역 */}
        {/* 이미지 영역 */}
        <section className={styles.photoSection}>
          {item.images?.length ? (
            <div className={styles.carouselContainer}>
              <div className={styles.carouselTrack} ref={trackRef} onScroll={handleImageScroll}>
                {/* ✅ 기존 이미지 렌더 */}
                {item.images.map((img, idx) => (
                  <div key={img.fileId || idx} className={styles.carouselSlide}>
                    <img
                      src={img.url || img}
                      alt={`${item.name}-${idx}`}
                      className={styles.previewImage}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveImage(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {/* ✅ 마지막 “사진 추가” 카드 (편집 모드일 때만 표시) */}
                {isEditing && item.images?.length < 5 && (
                  <div
                    className={clsx(styles.carouselSlide, styles.addNewCard)}
                    onClick={() => document.getElementById("edit-file-input").click()}
                  >
                    <img src={ImagePlusIcon} alt="사진 추가" className={styles.addIcon} />
                    <span className={styles.addText}>사진 추가</span>
                  </div>
                )}
              </div>

              {/* ✅ 이미지 개수 표시 */}
              {item.images?.length > 1 && (
                <div className={styles.photoCount}>
                  <span className={styles.currentImage}>{currentIndex + 1}</span>
                  <span className={styles.imageSeparator}>/</span>
                  <span className={styles.totalImages}>{item.images.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.imageFallback}>등록된 사진이 없어요</div>
          )}

          {/* ✅ 파일 input (트리거용, 기존 로직 유지) */}
          <input
            id="edit-file-input"
            type="file"
            accept="image/*"
            multiple
            className={styles.fileInput}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;

              setNewFiles((prev) => [...prev, ...files]);

              const newImageUrls = files.map((file) => ({
                url: URL.createObjectURL(file),
                fileId: null, // 새 이미지는 fileId 없음
              }));

              setItem((prev) => ({
                ...prev,
                images: [...(prev.images || []), ...newImageUrls],
              }));

              e.target.value = ""; // 같은 파일 재선택 가능하도록 초기화
            }}
          />
          {isEditing ? (
            <input
              className={styles.itemNameInput}
              value={item.name || ""}
              placeholder="옷 이름을 입력하세요"
              onChange={(e) => handleFieldChange("name", e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "18px",
                fontWeight: "600",
                border: "1px solid #ddd",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            />
          ) : (
            <h2 className={styles.itemName}>{item.name || "이름 없는 아이템"}</h2>
          )}

          <div className={clsx(styles.statRow, isEditing && styles.statRowEditing)}>
            <div className={clsx(styles.statCard, isEditing && styles.categoryCardWide)}>
              <span className={styles.statLabel}>카테고리</span>
              {isEditing ? (
                <>
                  <button
                    className={styles.categoryButton}
                    onClick={() => setIsCategorySheetOpen(true)}
                  >
                    {categoryLabel !== "-" ? categoryLabel : "카테고리 선택"}
                  </button>
                  {isCategorySheetOpen && (
                    <div
                      className={styles.sheetOverlay}
                      onClick={() => setIsCategorySheetOpen(false)}
                    >
                      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sheetHandle} />
                        <h3 className={styles.sheetTitle}>카테고리 선택</h3>

                        <div className={styles.sheetMainList}>
                          {mainCategories
                            .filter((main) => main.codeId !== "all")
                            .map((main) => (
                              <button
                                key={main.codeId}
                                type="button"
                                className={clsx(
                                  styles.sheetMainButton,
                                  item.categoryMain === main.codeId && styles.sheetMainActive,
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItem((prev) => ({
                                    ...prev,
                                    categoryMain: main.codeId,
                                    categoryCode: "",
                                  }));
                                }}
                              >
                                <img
                                  src={CATEGORY_ICON_MAP[main.codeName] || AccessoriesIcon}
                                  alt={main.codeName}
                                  className={styles.sheetMainIcon}
                                />
                                <span>{main.codeName}</span>
                              </button>
                            ))}
                        </div>

                        {item.categoryMain && (
                          <>
                            <h4 className={styles.sheetSubTitle}>세부 카테고리</h4>
                            <div className={styles.sheetSubGrid}>
                              {(subCategoriesMap[item.categoryMain] || [])
                                .filter((sub) => sub.codeId !== "all")
                                .map((sub) => (
                                  <button
                                    key={sub.codeId}
                                    type="button"
                                    className={clsx(
                                      styles.sheetSubButton,
                                      item.categoryCode === sub.codeId && styles.sheetSubActive,
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategorySelect(item.categoryMain, sub.codeId);
                                    }}
                                  >
                                    {sub.codeName}
                                  </button>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className={styles.statValue}>{categoryLabel}</span>
              )}
            </div>

            {!isEditing && (
              <>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>착용횟수</span>
                  <span className={styles.statValue}>{`${item.wearCount || 0}회`}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>최근착용</span>
                  <span className={styles.statValue}>{item.lastWornDate || "-"}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 상세정보 */}
        <section className={styles.infoSection}>
          {/* 브랜드 */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>브랜드</span>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                value={item.brand || ""}
                placeholder="브랜드를 입력하세요"
                onChange={(e) => handleFieldChange("brand", e.target.value)}
              />
            ) : (
              <span className={styles.fieldValue}>{item.brand || "-"}</span>
            )}
          </div>

          {/* 사이즈 */}
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>사이즈</span>
            {isEditing ? (
              <input
                className={styles.fieldInput}
                value={item.clothesSize || ""}
                placeholder="사이즈를 입력하세요"
                onChange={(e) => handleFieldChange("clothesSize", e.target.value)}
              />
            ) : (
              <span className={styles.fieldValue}>{item.clothesSize || "-"}</span>
            )}
          </div>

          {/* 상세정보 */}
          <div className={styles.detailGroup}>
            <button
              type="button"
              className={styles.detailToggle}
              onClick={() => setIsInfoOpen((prev) => !prev)}
            >
              <span className={styles.detailToggleLabel}>상세정보</span>
              <img
                src={ChevronDown}
                alt=""
                className={clsx(styles.chevron, isInfoOpen && styles.chevronOpen)}
              />
            </button>

            {isInfoOpen && (
              <div className={styles.detailPanel}>
                {/* 가격 */}
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>가격</span>
                  {isEditing ? (
                    <input
                      className={styles.fieldInput}
                      type="number"
                      placeholder="가격을 입력하세요"
                      value={item.price || ""}
                      onChange={(e) => handleFieldChange("price", e.target.value)}
                    />
                  ) : (
                    <span className={clsx(styles.fieldValue, styles.textRight)}>
                      {item.price ? `${Number(item.price).toLocaleString()}원` : "-"}
                    </span>
                  )}
                </div>

                {/* 구매일 */}
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>구매일</span>
                  {isEditing ? (
                    <input
                      className={styles.fieldInput}
                      type="date"
                      value={item.purchaseDate || ""}
                      onChange={(e) => handleFieldChange("purchaseDate", e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  ) : (
                    <span className={clsx(styles.fieldValue, styles.textRight)}>
                      {item.purchaseDate || "-"}
                    </span>
                  )}
                </div>

                {/* 구매링크 */}
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>구매링크</span>
                  {isEditing ? (
                    <input
                      className={styles.fieldInput}
                      placeholder="링크를 입력하세요"
                      value={item.purchaseUrl || ""}
                      onChange={(e) => handleFieldChange("purchaseUrl", e.target.value)}
                    />
                  ) : (
                    <span className={clsx(styles.fieldValue, styles.textRight)}>
                      {item.purchaseUrl || "-"}
                    </span>
                  )}
                </div>

                {/* 설명 */}
                <div className={clsx(styles.fieldRow, styles.fieldAlignTop, styles.fieldEditing)}>
                  <span className={styles.fieldLabel}>설명</span>
                  {isEditing ? (
                    <textarea
                      className={styles.fieldInput}
                      placeholder="설명을 입력하세요"
                      value={item.description || ""}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                    />
                  ) : (
                    <span className={clsx(styles.fieldValue, styles.descriptionValue)}>
                      {item.description || "-"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        {isEditing ? (
          <>
            <button type="button" className={styles.primaryAction} onClick={handleToggleEdit}>
              수정완료
            </button>
            <button type="button" className={styles.secondaryAction} onClick={handleCancelEdit}>
              취소
            </button>
          </>
        ) : (
          <>
            <button type="button" className={styles.primaryAction} onClick={handleToggleEdit}>
              수정하기
            </button>
            <button type="button" className={styles.secondaryAction} onClick={handleDelete}>
              삭제하기
            </button>
          </>
        )}
      </footer>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="옷 삭제"
        message="정말 이 옷을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

      {/* 오류/성공 모달 */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title={
          errorMessage.includes("완료") || errorMessage.includes("삭제되었습니다") ? "완료" : "오류"
        }
        message={errorMessage}
        confirmText="확인"
        cancelText=""
      />
    </div>
  );
};

export default ClosetDetailPage;
