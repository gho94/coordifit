import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import commonCodeService from "../../services/commonCodeService";
import clothesService from "@/services/clothesService";
import { useSnapStore } from "../../stores/snapStore";
import styles from "./SnapAddPage.module.css";
import cameraIcon from "@/assets/images/snapupload.png";
import checkIcon from "@/assets/images/checkicon.png";

const SnapAddPage = () => {
  const navigate = useNavigate();
  const {
    setImageFiles: setSnapImageFiles,
    setUploadedImages: setSnapUploadedImages,
    setSelectedItems: setSnapSelectedItems,
    setDeletedFileIds: setSnapDeletedFileIds,
    editPostData,
  } = useSnapStore();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [mainCategory, setMainCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [clothesItems, setClothesItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  useEffect(() => {
    if (mainCategory === "all") {
      setSubCategories([]);
      return;
    }

    const subCategoriesForMain = subCategoriesMap[mainCategory] || [];
    setSubCategories(subCategoriesForMain);
  }, [mainCategory, subCategoriesMap]);

  // 옷 정보 로드
  useEffect(() => {
    const loadAllClothes = async () => {
      try {
        const response = await clothesService.getUserClothes();
        console.log("전체 옷 정보:", response);
        if (response.success && response.data) {
          setClothesItems(response.data);
        } else {
          setClothesItems([]);
        }
      } catch (error) {
        console.error("옷 정보 로드 오류:", error);
        setClothesItems([]);
      }
    };

    loadAllClothes();
  }, []);

  useEffect(() => {
    if (editPostData) {
      if (editPostData.images && editPostData.images.length > 0) {
        setUploadedImages(editPostData.images);
      }

      if (editPostData.clothes && editPostData.clothes.length > 0) {
        const clothesIds = editPostData.clothes.map((item) => item.clothesId);
        setSelectedItems(clothesIds);
      }
    }
  }, [editPostData]);

  // 필터링된 아이템들
  const filteredItems = useMemo(() => {
    return clothesItems.filter((item) => {
      // 전체 선택 시 모든 아이템 표시
      if (mainCategory === "all") {
        return true;
      }

      // 서브카테고리 선택 시 해당 서브카테고리만 표시
      if (subCategory !== "all") {
        return item.categoryCode === subCategory;
      }

      // 메인카테고리 선택 시 해당 메인카테고리 하위의 모든 서브카테고리 표시
      const subCategoriesForMain = subCategoriesMap[mainCategory] || [];
      const subCategoryCodes = subCategoriesForMain.map((sub) => sub.codeId);
      return subCategoryCodes.includes(item.categoryCode);
    });
  }, [clothesItems, mainCategory, subCategory, subCategoriesMap]);

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const remainingSlots = 10 - uploadedImages.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length === 0) {
        setErrorMessage("최대 10장까지만 업로드 가능합니다.");
        setShowErrorModal(true);
        return;
      }

      // 파일 유효성 검사
      const validFiles = filesToAdd.filter((file) => {
        if (!file.type.startsWith("image/")) {
          setErrorMessage(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          setShowErrorModal(true);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          // 10MB 제한
          setErrorMessage(`${file.name}은(는) 10MB를 초과합니다.`);
          setShowErrorModal(true);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // 파일들을 File 객체로 저장
      setImageFiles((prev) => [...prev, ...validFiles]);

      // 미리보기를 위한 URL 생성
      const newImageUrls = validFiles.map((file) => URL.createObjectURL(file));
      setUploadedImages((prev) => [...prev, ...newImageUrls]);
    };
    input.click();
  };

  const removeImage = (index) => {
    const imageToDelete = uploadedImages[index];

    if (imageToDelete?.fileId) {
      setDeletedFileIds((prev) => [...prev, imageToDelete.fileId]);
    } else {
      URL.revokeObjectURL(imageToDelete);
    }

    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    // 모든 데이터를 Zustand store에 저장
    setSnapImageFiles([...imageFiles]);
    setSnapUploadedImages([...uploadedImages]);
    setSnapSelectedItems([...selectedItems]);
    setSnapDeletedFileIds([...deletedFileIds]);

    // 스냅 업로드 완료 페이지로 이동
    navigate("/snap/upload-complete");
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const handleCategoryChange = (id) => {
    setMainCategory(id);
    setSubCategory("all");
  };

  const handleSubCategoryChange = (id) => {
    setSubCategory(id);
  };

  const handleAddMoreProducts = () => {
    setShowSelectedOnly(false);
  };

  const canProceed = () => {
    return uploadedImages.length > 0 && selectedItems.length > 0;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.stepContent}>
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p>카테고리를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.stepContent}>
        {/* 이미지 업로드 섹션 */}
        <div className={styles.imageUploadSection}>
          <div className={styles.sectionHeader}>
            <h3>{editPostData ? "스냅 사진 수정" : "스냅 사진을 올려주세요"}</h3>
            <span className={styles.required}>필수</span>
          </div>
          <p className={styles.uploadHint}>사진은 최대 10장까지 등록 가능합니다.</p>

          {uploadedImages.length === 0 ? (
            <div className={styles.uploadArea} onClick={handleImageUpload}>
              <img src={cameraIcon} alt="카메라 아이콘" className={styles.cameraIcon} />
              <p>사진 첨부</p>
            </div>
          ) : (
            <div className={styles.uploadedImages}>
              {uploadedImages.map((image, index) => (
                <div key={index} className={styles.uploadedImage}>
                  <img src={image.url || image} alt={`업로드된 이미지 ${index + 1}`} />
                  <button className={styles.removeImageButton} onClick={() => removeImage(index)}>
                    ×
                  </button>
                </div>
              ))}
              {uploadedImages.length < 10 && (
                <div className={styles.addMoreButton} onClick={handleImageUpload}>
                  <div className={styles.uploadIcon}>📷</div>
                  <p>사진 추가</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 상품 선택 섹션 */}
        <div className={styles.productSelectionSection}>
          <div className={styles.sectionHeader}>
            <h3>함께 착용한 상품을 선택해주세요</h3>
            <span className={styles.required}>필수</span>
          </div>
          {selectedItems.length > 0 && (
            <button
              type="button"
              className={styles.toggleViewButton}
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            >
              {showSelectedOnly ? "상품 추가" : "선택된 상품 보기"}
            </button>
          )}

          {!showSelectedOnly ? (
            <>
              <div className={styles.categoryTabs}>
                {mainCategories.map((category) => (
                  <button
                    key={category.codeId}
                    type="button"
                    className={clsx(
                      styles.categoryTab,
                      mainCategory === category.codeId && styles.activeCategoryTab,
                    )}
                    onClick={() => handleCategoryChange(category.codeId)}
                  >
                    {category.codeName}
                  </button>
                ))}
              </div>

              {subCategories.length > 1 && (
                <div className={styles.subCategoryTabs}>
                  {subCategories.map((category) => (
                    <button
                      key={category.codeId}
                      type="button"
                      className={clsx(
                        styles.subCategoryTab,
                        subCategory === category.codeId && styles.activeSubCategoryTab,
                      )}
                      onClick={() => handleSubCategoryChange(category.codeId)}
                    >
                      {category.codeName}
                    </button>
                  ))}
                </div>
              )}
              <div className={styles.productGrid}>
                {filteredItems.map((item) => (
                  <div key={item.clothesId} className={styles.productCard}>
                    <img src={item.imageUrl} alt={item.name} />
                    <div className={styles.radioWrapper}>
                      <input
                        type="checkbox"
                        id={item.clothesId}
                        checked={selectedItems.includes(item.clothesId)}
                        onChange={() => toggleItemSelection(item.clothesId)}
                      />
                      <label htmlFor={item.clothesId}></label>

                      {/* ✅ 체크되면 아이콘 표시 */}
                      {selectedItems.includes(item.clothesId) && (
                        <img src={checkIcon} alt="선택됨" className={styles.checkIcon} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.selectedProductsView}>
              <div className={styles.selectedProducts}>
                {selectedItems.map((itemId) => {
                  const item = clothesItems.find((i) => i.clothesId === itemId);
                  return item ? (
                    <div key={itemId} className={styles.selectedProduct}>
                      <img src={item.imageUrl} alt={item.name} />
                      <span className={styles.productName}>{item.name}</span>
                      <button
                        className={styles.removeProductButton}
                        onClick={() => toggleItemSelection(itemId)}
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
                <div className={styles.addProductPlaceholder} onClick={handleAddMoreProducts}>
                  <span>+</span>
                  <span className={styles.addText}>상품 추가</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.actionButtonWrapper}>
        <button
          type="button"
          className={clsx(styles.actionButton, canProceed() && styles.actionButtonActive)}
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {selectedItems.length > 0
            ? `${selectedItems.length}개 상품 선택완료`
            : "상품을 선택하세요."}
        </button>
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
        variant="default"
      />
    </div>
  );
};

export default SnapAddPage;
