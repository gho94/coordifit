import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";
import commonCodeService from "../../services/commonCodeService";
import clothesService from "@/services/clothesService";
import styles from "./ClosetRegisterPage.module.css";

import TopIcon from "@/assets/images/topicon.png";
import BottomIcon from "@/assets/images/bottomicon.png";
import ShoesIcon from "@/assets/images/shoesicon.png";
import OuterIcon from "@/assets/images/outericon.png";
import AccessoriesIcon from "@/assets/images/accessoriesicon.png";
import EnrollIcon from "@/assets/images/enrollicon.png";
import CalendarIcon from "@/assets/images/calendaricon.png";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { useQueryClient } from "@tanstack/react-query";
import ImagePlusIcon from "@/assets/images/imageplusicon.png";
import ArrowLeftIcon from "@/assets/images/arrow-left.png";
import ArrowRightIcon from "@/assets/images/arrow-right.png";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

const MAX_PHOTOS = 5;

const CATEGORY_ICON_MAP = {
  상의: TopIcon,
  하의: BottomIcon,
  신발: ShoesIcon,
  아우터: OuterIcon,
  패션소품: AccessoriesIcon,
};

const ClosetRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // OCR에서 전달받은 데이터
  const {
    ocrProducts: initialOcrProducts,
    isMultipleRegistration,
    originalImage,
  } = location.state || {};

  // 다중 등록을 위한 현재 인덱스 상태
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  // OCR 상품 목록을 state로 관리 (등록 완료 시 제거하기 위해)
  const [ocrProducts, setOcrProducts] = useState(initialOcrProducts || []);

  // 현재 상품 데이터 가져오기
  const currentProduct = ocrProducts?.[currentProductIndex];

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    size: "",
    price: "",
    purchaseDate: "",
    purchaseLink: "",
    description: "",
    category: "",
    subCategory: "",
  });

  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);

  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const remainingSlots = MAX_PHOTOS - photoPreviews.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      setErrorMessage("최대 5장까지만 업로드 가능합니다.");
      setShowErrorModal(true);
      return;
    }

    setPhotoFiles((prev) => [...prev, ...filesToAdd]);

    const newImageUrls = filesToAdd.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newImageUrls]);

    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const categoryData = await commonCodeService.getCategoryData();
        setMainCategories(categoryData.mainCategories);
        setSubCategoriesMap(categoryData.subCategoriesMap);
        setLoading(false);
      } catch (error) {
        console.error("카테고리 로드 오류:", error);
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // OCR 데이터로 폼 초기화
  useEffect(() => {
    if (currentProduct) {
      setFormData((prev) => ({
        ...prev,
        name: currentProduct.name || "",
        brand: currentProduct.brand || "",
        size: currentProduct.size || "",
        price: currentProduct.price || "",
        purchaseDate: currentProduct.purchaseDate || "",
        purchaseLink: currentProduct.purchaseLink || "",
        description: currentProduct.description || "",
      }));

      // 원본 이미지가 있다면 미리보기로 설정
      if (originalImage && currentProductIndex === 0) {
        setPhotoPreviews([originalImage]);
      }
    }
  }, [currentProduct, currentProductIndex, originalImage]);

  // 다중 등록에서 상품 변경 시 사진과 폼 데이터 초기화
  useEffect(() => {
    if (isMultipleRegistration && currentProductIndex > 0) {
      // 사진 데이터 초기화
      setPhotoPreviews([]);
      setPhotoFiles([]);

      // 카테고리 상태 초기화
      setFormData((prev) => ({
        ...prev,
        category: "",
        subCategory: "",
      }));
      setActiveMainCategory(null);
    }
  }, [currentProductIndex, isMultipleRegistration]);

  const handleCategorySelect = (mainCodeId, subCodeId) => {
    setFormData((prev) => ({
      ...prev,
      category: mainCodeId,
      subCategory: subCodeId,
    }));
    setIsCategorySheetOpen(false);
  };

  // 다중 상품 네비게이션 함수들
  const goToPreviousProduct = () => {
    if (currentProductIndex > 0) {
      setCurrentProductIndex((prev) => prev - 1);
    }
  };

  const goToNextProduct = () => {
    if (currentProductIndex < ocrProducts.length - 1) {
      setCurrentProductIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (photoPreviews.length === 0) {
      setErrorMessage("사진을 1장 이상 등록해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.name.trim().length === 0) {
      setErrorMessage("이름을 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.name.trim().length > 100) {
      setErrorMessage("이름은 100자 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (!formData.category || !formData.subCategory) {
      setErrorMessage("카테고리를 선택해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.brand.trim().length === 0) {
      setErrorMessage("브랜드를 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.brand.trim().length > 100) {
      setErrorMessage("브랜드는 100자 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.size && formData.size.length > 20) {
      setErrorMessage("사이즈는 20자 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.price && formData.price.length > 10) {
      setErrorMessage("가격은 10자리 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.purchaseLink && formData.purchaseLink.length > 1000) {
      setErrorMessage("구매링크는 1000자 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    if (formData.description && formData.description.length > 1000) {
      setErrorMessage("설명은 1000자 이내로 입력해주세요.");
      setShowErrorModal(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const clothesData = {
        name: formData.name,
        brand: formData.brand,
        categoryCode: formData.subCategory,
        clothesSize: formData.size,
        price: formData.price ? parseInt(formData.price) : null,
        purchaseDate: formData.purchaseDate,
        purchaseUrl: formData.purchaseLink,
        description: formData.description,
        files: photoFiles,
      };

      queryClient.invalidateQueries(["clothes"]);
      const response = await clothesService.createClothes(clothesData);

      if (response.success) {
        // 다중 등록의 경우 등록된 상품을 목록에서 제거
        if (isMultipleRegistration) {
          // 현재 상품을 목록에서 제거
          const updatedProducts = ocrProducts.filter((_, index) => index !== currentProductIndex);
          setOcrProducts(updatedProducts);

          if (updatedProducts.length > 0) {
            // 남은 상품이 있는 경우
            setErrorMessage("옷이 성공적으로 등록되었습니다! 다음 상품을 등록해주세요.");
            setShowSuccessModal(true);

            // 폼 초기화
            setFormData({
              name: "",
              brand: "",
              size: "",
              price: "",
              purchaseDate: "",
              purchaseLink: "",
              description: "",
              category: "",
              subCategory: "",
            });
            setPhotoPreviews([]);
            setPhotoFiles([]);
            setActiveMainCategory(null);

            // 인덱스 조정: 현재 인덱스가 배열 길이보다 크거나 같으면 마지막 인덱스로
            if (currentProductIndex >= updatedProducts.length) {
              setCurrentProductIndex(updatedProducts.length - 1);
            }
            // 인덱스가 유효하면 그대로 유지 (자동으로 다음 상품으로 이동)
          } else {
            // 모든 상품 등록 완료
            setErrorMessage("모든 상품이 성공적으로 등록되었습니다!");
            setShowSuccessModal(true);
            setTimeout(() => {
              navigate("/closet");
            }, 2000);
          }
        } else {
          // 단일 등록인 경우
          setErrorMessage("옷이 성공적으로 등록되었습니다!");
          setShowSuccessModal(true);
          setTimeout(() => {
            navigate("/closet");
          }, 2000);
        }
      } else {
        setErrorMessage(response.message || "등록에 실패했습니다.");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("옷 등록 오류:", error);
      setErrorMessage("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = useMemo(() => {
    return (
      photoPreviews.length > 0 &&
      formData.name.trim().length > 0 &&
      formData.category &&
      formData.subCategory &&
      formData.brand.trim().length > 0
    );
  }, [
    photoPreviews.length,
    formData.name,
    formData.category,
    formData.subCategory,
    formData.brand,
  ]);

  // 로딩 상태
  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>카테고리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        styles.page,
        isMultipleRegistration && ocrProducts.length > 1 && styles.withMultipleHeader,
      )}
    >
      {/* 다중 등록 진행 상황 헤더 */}
      {isMultipleRegistration && ocrProducts.length > 1 && (
        <div className={styles.multipleHeader}>
          <div className={styles.progressInfo}>
            <span className={styles.productName}>{currentProduct?.name || "상품명 없음"}</span>
            <span className={styles.progressText}>
              {currentProductIndex + 1}/{ocrProducts.length}
            </span>
          </div>
          <div className={styles.navigationButtons}>
            <button
              type="button"
              className={styles.navButton}
              onClick={goToPreviousProduct}
              disabled={currentProductIndex === 0}
            >
              <img src={ArrowLeftIcon} alt="이전" className={styles.arrowIcon} />
            </button>
            <button
              type="button"
              className={styles.navButton}
              onClick={goToNextProduct}
              disabled={currentProductIndex === ocrProducts.length - 1}
            >
              <img src={ArrowRightIcon} alt="다음" className={styles.arrowIcon} />
            </button>
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 사진 업로드 */}
        <section className={styles.photoSection}>
          {photoPreviews.length === 0 ? (
            <>
              <p className={styles.photoGuide}>사진 등록 0/{MAX_PHOTOS} (1개 이상)</p>
              {/* ✅ 첫 진입 시 등록 아이콘 클릭 시만 작동 */}
              <div
                className={styles.photoUploader}
                onClick={() => document.getElementById("photo-input").click()}
              >
                <div className={styles.photoPlaceholder}>
                  <img src={EnrollIcon} alt="등록 아이콘" className={styles.photoIcon} />
                  <span className={styles.photoText}>사진 추가</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.previewScroll}>
                {photoPreviews.map((photoUrl, index) => (
                  <div key={index} className={styles.previewItem}>
                    <img
                      src={photoUrl}
                      alt={`이미지 ${index + 1}`}
                      className={styles.previewImage}
                    />
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* ✅ 마지막 카드 클릭 시에만 파일창 열기 */}
                {photoPreviews.length < MAX_PHOTOS && (
                  <div
                    className={clsx(styles.previewItem, styles.addNewCard)}
                    onClick={() => document.getElementById("photo-input").click()}
                  >
                    <img src={ImagePlusIcon} alt="사진 추가" className={styles.addIcon} />
                    <span className={styles.addText}>사진 추가</span>
                  </div>
                )}
              </div>

              <span className={styles.photoCount}>
                {photoPreviews.length}/{MAX_PHOTOS}
              </span>
            </>
          )}

          <input
            id="photo-input"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </section>

        {/* 폼 입력 */}
        <section className={styles.fieldSection}>
          {/* 이름 */}
          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>이름</span>
            <input
              type="text"
              className={styles.input}
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </label>

          {/* 카테고리 */}
          <label className={styles.fieldRow} onClick={() => setIsCategorySheetOpen(true)}>
            <span className={styles.fieldLabel}>카테고리</span>
            <span className={clsx(styles.fieldValue, !formData.category && styles.placeholder)}>
              {formData.category && formData.subCategory
                ? `${mainCategories.find((c) => c.codeId === formData.category)?.codeName} / ${
                    subCategoriesMap[formData.category]?.find(
                      (s) => s.codeId === formData.subCategory,
                    )?.codeName
                  }`
                : "카테고리 선택"}
            </span>
          </label>

          {/* 나머지 필드 */}
          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>브랜드</span>
            <input
              type="text"
              className={styles.input}
              placeholder="브랜드를 입력하세요"
              value={formData.brand}
              onChange={(e) => handleChange("brand", e.target.value)}
            />
          </label>

          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>사이즈</span>
            <input
              type="text"
              className={styles.input}
              placeholder="사이즈를 입력하세요"
              value={formData.size}
              onChange={(e) => handleChange("size", e.target.value)}
            />
          </label>

          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>가격</span>
            <input
              type="number"
              className={clsx(styles.input)}
              placeholder="가격을 입력하세요"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </label>

          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>구매일</span>
            <div className={styles.dateRow}>
              <img src={CalendarIcon} alt="캘린더" className={styles.calendarIcon} />
              <DatePicker
                selected={formData.purchaseDate ? new Date(formData.purchaseDate) : null}
                onChange={(date) =>
                  handleChange("purchaseDate", date ? date.toISOString().split("T")[0] : "")
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="날짜를 선택하세요"
                className={clsx(styles.input, !formData.purchaseDate && styles.placeholder)}
                maxDate={new Date()}
              />
            </div>
          </label>

          <label className={styles.fieldRow}>
            <span className={styles.fieldLabel}>구매링크</span>
            <input
              type="url"
              className={styles.input}
              placeholder="링크를 입력하세요"
              value={formData.purchaseLink}
              onChange={(e) => handleChange("purchaseLink", e.target.value)}
            />
          </label>

          <label className={clsx(styles.fieldRow, styles.textareaRow)}>
            <span className={styles.fieldLabel}>설명</span>
            <textarea
              className={styles.textarea}
              placeholder="설명을 입력하세요"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>
        </section>
      </form>
      <div className={styles.bottomBar}>
        <button
          type="submit"
          className={clsx(
            styles.submitButton,
            (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
          )}
          disabled={!isFormValid || isSubmitting}
          onClick={handleSubmit} // ✅ 직접 실행 (form 밖이므로)
        >
          {isSubmitting
            ? "등록 중..."
            : isMultipleRegistration && ocrProducts.length > 1
              ? `등록하기 ${currentProductIndex + 1}/${ocrProducts.length}`
              : "등록하기"}
        </button>
      </div>
      {isCategorySheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setIsCategorySheetOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <h2 className={styles.sheetTitle}>카테고리 선택</h2>

            <div className={styles.sheetMainList}>
              {mainCategories
                .filter((category) => category.codeId !== "all")
                .map((category) => (
                  <button
                    key={category.codeId}
                    type="button"
                    className={clsx(
                      styles.sheetMainButton,
                      activeMainCategory === category.codeId && styles.sheetMainActive,
                    )}
                    onClick={() => setActiveMainCategory(category.codeId)}
                  >
                    <img
                      src={CATEGORY_ICON_MAP[category.codeName] || AccessoriesIcon}
                      alt={category.codeName}
                      className={styles.sheetMainIcon}
                    />
                    <span>{category.codeName}</span>
                  </button>
                ))}
            </div>

            <div className={styles.sheetSubList}>
              {activeMainCategory ? (
                <>
                  <h3 className={styles.sheetSubTitle}>세부 카테고리</h3>
                  <div className={styles.sheetSubGrid}>
                    {(subCategoriesMap[activeMainCategory] || [])
                      .filter((sub) => sub.codeId !== "all")
                      .map((sub) => (
                        <button
                          key={sub.codeId}
                          type="button"
                          className={clsx(
                            styles.sheetSubButton,
                            formData.category === activeMainCategory &&
                              formData.subCategory === sub.codeId &&
                              styles.sheetSubActive,
                          )}
                          onClick={() => handleCategorySelect(activeMainCategory, sub.codeId)}
                        >
                          {sub.codeName}
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <p className={styles.sheetSubPlaceholder}>먼저 카테고리를 선택해주세요</p>
              )}
            </div>
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

      {/* 성공 모달 */}
      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title="완료"
        message={errorMessage}
        confirmText="확인"
        cancelText=""
      />
    </div>
  );
};

export default ClosetRegisterPage;
