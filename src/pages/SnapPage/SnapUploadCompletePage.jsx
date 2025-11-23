import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clothesService from "@/services/clothesService";
import postService from "../../services/postService";
import { useSnapStore } from "../../stores/snapStore";
import styles from "./SnapUploadCompletePage.module.css";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

const SnapUploadCompletePage = () => {
  const navigate = useNavigate();
  const {
    imageFiles: snapImageFiles,
    uploadedImages: snapUploadedImages,
    selectedItems: snapSelectedItems,
    deletedFileIds: snapDeletedFileIds,
    editPostData,
    clearSnapData,
  } = useSnapStore();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [postContent, setPostContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [clothesItems, setClothesItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Zustand store에서 모든 데이터 가져오기
    setUploadedImages(snapUploadedImages);
    setSelectedItems(snapSelectedItems);
    setImageFiles(snapImageFiles);
    setDeletedFileIds(snapDeletedFileIds);

    if (editPostData) {
      setPostContent(editPostData.content || "");
      setIsPublic(editPostData.isPublic ?? true);
    }
  }, [snapImageFiles, snapUploadedImages, snapSelectedItems, snapDeletedFileIds, editPostData]);

  // 옷 정보 로드
  useEffect(() => {
    const loadClothes = async () => {
      try {
        const response = await clothesService.getUserClothes();
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

    loadClothes();
  }, []);

  const handlePostContentChange = (e) => {
    setPostContent(e.target.value);
  };

  const handlePublicToggle = () => {
    setIsPublic(!isPublic);
  };

  const handleUpload = async () => {
    if (uploading) return;

    setUploading(true);

    try {
      if (editPostData) {
        const result = await postService.updatePost(editPostData.postId, {
          content: postContent,
          isPublic: isPublic,
          clothesIds: selectedItems,
          deletedFileIds: deletedFileIds,
          files: imageFiles,
        });

        console.log("게시물 수정 성공:", result);
        setErrorMessage("게시물이 성공적으로 수정되었습니다.");
        setShowSuccessModal(true);
        clearSnapData();
        setTimeout(() => {
          navigate("/main");
        }, 2000);
      } else {
        // 게시물 등록
        const result = await postService.createPost({
          content: postContent,
          isPublic: isPublic,
          clothesIds: selectedItems,
          files: imageFiles,
        });

        console.log("게시물 등록 성공:", result);
        clearSnapData();
        navigate("/main");
      }
    } catch (error) {
      console.error(editPostData ? "게시물 수정 실패:" : "게시물 등록 실패:", error);
      setErrorMessage(
        editPostData
          ? "게시물 수정에 실패했습니다. 다시 시도해주세요."
          : "게시물 등록에 실패했습니다. 다시 시도해주세요.",
      );
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // 이전 페이지로 돌아가기
  };

  const getSelectedProducts = () => {
    return selectedItems
      .map((itemId) => clothesItems.find((item) => item.clothesId === itemId))
      .filter(Boolean);
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepContent}>
        {/* 업로드된 스냅 이미지들 */}
        <div className={styles.snapImages}>
          {uploadedImages.map((image, index) => (
            <div key={index} className={styles.snapImage}>
              <img src={image.url || image} alt={`스냅 이미지 ${index + 1}`} />
            </div>
          ))}
        </div>

        {/* 스냅 설명 입력 */}
        <div className={styles.contentSection}>
          <textarea
            className={styles.contentInput}
            placeholder="스냅에 관련된 말들을 적어주세요."
            value={postContent}
            onChange={handlePostContentChange}
            rows={4}
          />
        </div>

        {/* 착용 상품 정보 */}
        <div className={styles.productSection}>
          <h3>착용 상품 정보</h3>
          <div className={styles.selectedProductsScroll}>
            {getSelectedProducts().map((product) => (
              <div key={product.clothesId} className={styles.productCard}>
                <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                <div className={styles.productText}>
                  <div className={styles.brandName}>{product.brand}</div>
                  <div className={styles.productName}>{product.name}</div>
                  <div className={styles.price}>
                    {product.price ? `${product.price.toLocaleString()}원` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 게시글 공개 설정 */}
        <div className={styles.visibilitySection}>
          <div className={styles.visibilityToggle}>
            <span>게시글 공개</span>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={isPublic} onChange={handlePublicToggle} />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </div>

      {/* 업로드/수정 버튼 */}
      <div className={styles.actionButtonWrapper}>
        <button className={styles.actionButton} onClick={handleUpload} disabled={uploading}>
          {uploading ? "처리 중..." : editPostData ? "수정 완료" : "업로드"}
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

export default SnapUploadCompletePage;
