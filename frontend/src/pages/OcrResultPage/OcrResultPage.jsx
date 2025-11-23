import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "./OcrResultPage.module.css";
import editIcon from "@/assets/images/editpencil.png";
import trashIcon from "@/assets/images/trash.png";
import checkIcon from "@/assets/images/checkicon.png";
import cancelIcon from "@/assets/images/circle-x.png";

// IndexedDB 헬퍼 함수들
const DB_NAME = "OcrDataDB";
const STORE_NAME = "ocrData";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const saveToIndexedDB = async (key, value) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("IndexedDB 저장 실패:", error);
    throw error;
  }
};

const loadFromIndexedDB = async (key) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB 로드 실패:", error);
    return null;
  }
};

const OcrResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  // 상태 최적화: 필요한 상태만 관리
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { originalImage, ocrData, analysisResult } = location.state || {};

  // 실제 사용할 데이터
  const [finalOriginalImage, setFinalOriginalImage] = useState(originalImage);
  const [finalOcrData, setFinalOcrData] = useState(ocrData);
  const [finalAnalysisResult, setFinalAnalysisResult] = useState(analysisResult);

  // IndexedDB에서 데이터 복원
  useEffect(() => {
    const restoreData = async () => {
      if (!originalImage && !ocrData && !analysisResult) {
        setIsDataLoading(true);
        try {
          // IndexedDB에서 데이터 로드
          const savedImage = await loadFromIndexedDB("originalImage");
          const savedOcrData = await loadFromIndexedDB("ocrData");
          const savedAnalysisResult = await loadFromIndexedDB("analysisResult");
          const savedSelectedItems = await loadFromIndexedDB("selectedItems");

          if (savedImage) setFinalOriginalImage(savedImage);
          if (savedOcrData) setFinalOcrData(savedOcrData);
          if (savedAnalysisResult) setFinalAnalysisResult(savedAnalysisResult);
          if (savedSelectedItems) setSelectedItems(new Set(savedSelectedItems));
        } catch (error) {
          console.error("데이터 복원 실패:", error);
        } finally {
          setIsDataLoading(false);
        }
      }
    };

    restoreData();
  }, [originalImage, ocrData, analysisResult]);

  const products = useMemo(() => finalAnalysisResult?.data?.products || [], [finalAnalysisResult]);

  const extractPurchaseDate = useMemo(() => {
    if (!finalOcrData?.results) return "날짜 정보 없음";
    const datePattern = /\d{2,4}[.\-/]\d{1,2}[.\-/]\d{1,2}(\([가-힣]\))?/;
    for (const result of finalOcrData.results) {
      if (result.text && datePattern.test(result.text)) {
        return `구매일: ${result.text}`;
      }
    }
    return "구매일: 날짜 정보 없음";
  }, [finalOcrData]);

  // 이미지 URL memoization
  const imageUrl = useMemo(() => {
    if (finalOriginalImage && finalOriginalImage instanceof File) {
      try {
        return URL.createObjectURL(finalOriginalImage);
      } catch (error) {
        console.error("createObjectURL 실패:", error);
        return null;
      }
    }
    return null;
  }, [finalOriginalImage]);

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      if (imageUrl) {
        try {
          URL.revokeObjectURL(imageUrl);
        } catch (e) {}
      }
    };
  }, [imageUrl]);

  // 스크롤 핸들러
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = 320;
      const newPage = Math.round(scrollLeft / itemWidth);
      setCurrentPage(newPage);
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // 편집 핸들러
  const handleEdit = useCallback(
    (itemIndex, field, e) => {
      e.stopPropagation();
      const editKey = `${itemIndex}-${field}`;
      setEditingField({ itemIndex, field });
      setEditValues((prev) => ({
        ...prev,
        [editKey]: products[itemIndex][field] || "",
      }));
    },
    [products],
  );

  const handleSave = useCallback(
    (itemIndex, field, e) => {
      e.stopPropagation();
      const editKey = `${itemIndex}-${field}`;
      const newValue = editValues[editKey];
      console.log(`${field} 수정:`, newValue);
      setEditingField(null);
      setEditValues((prev) => {
        const updated = { ...prev };
        delete updated[editKey];
        return updated;
      });
    },
    [editValues],
  );

  const handleCancel = useCallback((e) => {
    e.stopPropagation();
    setEditingField(null);
    setEditValues({});
  }, []);

  const handleInputChange = useCallback((itemIndex, field, value) => {
    const editKey = `${itemIndex}-${field}`;
    setEditValues((prev) => ({
      ...prev,
      [editKey]: value,
    }));
  }, []);

  const isEditing = (itemIndex, field) => {
    return editingField?.itemIndex === itemIndex && editingField?.field === field;
  };

  const getDisplayValue = useCallback(
    (item, field, itemIndex) => {
      const editKey = `${itemIndex}-${field}`;
      if (isEditing(itemIndex, field)) {
        return editValues[editKey] || "";
      }

      switch (field) {
        case "brand":
          return item.brand || "예: 무신사 스탠다드";
        case "name":
          return item.name || "예: 오피스 캐주얼 룩";
        case "size":
          return item.size || "예: L, XL";
        case "price":
          return item.price ? `${item.price.toLocaleString()}원` : "예: 50,000원";
        default:
          return "";
      }
    },
    [editingField, editValues],
  );

  const handleDelete = useCallback((itemIndex, field, e) => {
    e.stopPropagation();
    if (confirm(`${field} 항목을 삭제하시겠습니까?`)) {
      console.log(`${field} 삭제`);
    }
  }, []);

  const handleItemSelect = useCallback((index) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const handleAddToCloset = useCallback(async () => {
    console.log("🚀 handleAddToCloset 실행됨");
    console.log("선택된 아이템들:", Array.from(selectedItems));

    if (selectedItems.size === 0) {
      setErrorMessage("추가할 상품을 선택해주세요.");
      setShowErrorModal(true);
      return;
    }

    const selectedProducts = Array.from(selectedItems).map((index) => products[index]);
    console.log("선택된 상품들:", selectedProducts);

    try {
      // IndexedDB에 데이터 저장 (File 객체 그대로 저장 가능)
      await saveToIndexedDB("originalImage", finalOriginalImage);
      await saveToIndexedDB("ocrData", finalOcrData);
      await saveToIndexedDB("analysisResult", finalAnalysisResult);
      await saveToIndexedDB("selectedItems", Array.from(selectedItems));

      // 상품 정보만 navigation state로 전달
      navigate("/closet/register", {
        state: {
          ocrProducts: selectedProducts,
          isMultipleRegistration: selectedProducts.length > 1,
        },
      });
    } catch (error) {
      console.error("데이터 저장 실패:", error);
      // 저장 실패해도 일단 이동
      navigate("/closet/register", {
        state: {
          ocrProducts: selectedProducts,
          isMultipleRegistration: selectedProducts.length > 1,
        },
      });
    }
  }, [selectedItems, products, finalOriginalImage, finalOcrData, finalAnalysisResult, navigate]);

  const handleRetry = useCallback(() => {
    navigate("/closet/ocr");
  }, [navigate]);

  useEffect(() => {
    // 데이터 복원 완료 후 인디케이터 동기화
    if (!isDataLoading && scrollRef.current && products.length > 0) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const itemWidth = 320;
      const newPage = Math.round(scrollLeft / itemWidth);
      setCurrentPage(newPage);
    }
  }, [isDataLoading, products.length]);

  if (isDataLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div style={{ textAlign: "center", padding: "50px" }}>
            <p>데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!finalAnalysisResult) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorMessage}>
            <p>분석 결과를 불러올 수 없습니다.</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.resultTitle}>구매내역 인식 결과 화면</h2>

        <h3 className={styles.sectionTitle}>실물 사진</h3>
        <div className={styles.originalImageSection}>
          {imageUrl && (
            <img src={imageUrl} alt="원본 영수증 이미지" className={styles.originalImage} />
          )}
        </div>

        <div className={styles.countMessage}>
          <p className={styles.countText}>총 {products.length}건의 구매 물건이 감지되었습니다.</p>
          <p className={styles.instructionText}>
            데이터를 확인하고 옷장에 추가하려면 추가하기 버튼을 눌러주세요
          </p>
        </div>

        <div className={styles.resultSection}>
          {products.length > 0 ? (
            <div className={styles.productsContainer}>
              {products.length > 1 && (
                <div className={styles.pageIndicator}>
                  {products.map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.dot} ${index === currentPage ? styles.activeDot : ""}`}
                    ></div>
                  ))}
                </div>
              )}

              <div className={styles.productCards} ref={scrollRef}>
                {products.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.resultItem} ${selectedItems.has(index) ? styles.selected : ""}`}
                    onClick={() => handleItemSelect(index)}
                  >
                    <div className={styles.purchaseDate}>
                      <span>{extractPurchaseDate}</span>
                    </div>

                    <div className={styles.tableHeader}>
                      <div className={styles.headerCell}>Filed</div>
                      <div className={styles.headerCell}>Value</div>
                    </div>

                    <div className={styles.tableBody}>
                      {/* 브랜드 행 */}
                      <div className={styles.tableRow}>
                        <div className={styles.fieldCell}>브랜드</div>
                        <div className={styles.valueCell}>
                          <div
                            className={`${styles.valueInput} ${!item.brand && !isEditing(index, "brand") ? styles.placeholder : ""}`}
                          >
                            {isEditing(index, "brand") ? (
                              <div className={styles.editingContainer}>
                                <input
                                  type="text"
                                  value={getDisplayValue(item, "brand", index)}
                                  onChange={(e) =>
                                    handleInputChange(index, "brand", e.target.value)
                                  }
                                  className={styles.editInput}
                                  autoFocus
                                />
                                <div className={styles.editActions}>
                                  <img
                                    src={checkIcon}
                                    alt="저장"
                                    className={styles.saveButton}
                                    onClick={(e) => handleSave(index, "brand", e)}
                                  />
                                  <img
                                    src={cancelIcon}
                                    alt="취소"
                                    className={styles.cancelButton}
                                    onClick={handleCancel}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{getDisplayValue(item, "brand", index)}</span>
                                <div className={styles.actionIcons}>
                                  <img
                                    src={editIcon}
                                    alt="편집"
                                    className={styles.editIcon}
                                    onClick={(e) => handleEdit(index, "brand", e)}
                                  />
                                  <img
                                    src={trashIcon}
                                    alt="삭제"
                                    className={styles.deleteIcon}
                                    onClick={(e) => handleDelete(index, "brand", e)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 상품명 행 */}
                      <div className={styles.tableRow}>
                        <div className={styles.fieldCell}>상품명</div>
                        <div className={styles.valueCell}>
                          <div
                            className={`${styles.valueInput} ${!item.name && !isEditing(index, "name") ? styles.placeholder : ""}`}
                          >
                            {isEditing(index, "name") ? (
                              <div className={styles.editingContainer}>
                                <input
                                  type="text"
                                  value={getDisplayValue(item, "name", index)}
                                  onChange={(e) => handleInputChange(index, "name", e.target.value)}
                                  className={styles.editInput}
                                  autoFocus
                                />
                                <div className={styles.editActions}>
                                  <img
                                    src={checkIcon}
                                    alt="저장"
                                    className={styles.saveButton}
                                    onClick={(e) => handleSave(index, "name", e)}
                                  />
                                  <img
                                    src={cancelIcon}
                                    alt="취소"
                                    className={styles.cancelButton}
                                    onClick={handleCancel}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{getDisplayValue(item, "name", index)}</span>
                                <div className={styles.actionIcons}>
                                  <img
                                    src={editIcon}
                                    alt="편집"
                                    className={styles.editIcon}
                                    onClick={(e) => handleEdit(index, "name", e)}
                                  />
                                  <img
                                    src={trashIcon}
                                    alt="삭제"
                                    className={styles.deleteIcon}
                                    onClick={(e) => handleDelete(index, "name", e)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 사이즈 행 */}
                      <div className={styles.tableRow}>
                        <div className={styles.fieldCell}>사이즈</div>
                        <div className={styles.valueCell}>
                          <div
                            className={`${styles.valueInput} ${!item.size && !isEditing(index, "size") ? styles.placeholder : ""}`}
                          >
                            {isEditing(index, "size") ? (
                              <div className={styles.editingContainer}>
                                <input
                                  type="text"
                                  value={getDisplayValue(item, "size", index)}
                                  onChange={(e) => handleInputChange(index, "size", e.target.value)}
                                  className={styles.editInput}
                                  autoFocus
                                />
                                <div className={styles.editActions}>
                                  <img
                                    src={checkIcon}
                                    alt="저장"
                                    className={styles.saveButton}
                                    onClick={(e) => handleSave(index, "size", e)}
                                  />
                                  <img
                                    src={cancelIcon}
                                    alt="취소"
                                    className={styles.cancelButton}
                                    onClick={handleCancel}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{getDisplayValue(item, "size", index)}</span>
                                <div className={styles.actionIcons}>
                                  <img
                                    src={editIcon}
                                    alt="편집"
                                    className={styles.editIcon}
                                    onClick={(e) => handleEdit(index, "size", e)}
                                  />
                                  <img
                                    src={trashIcon}
                                    alt="삭제"
                                    className={styles.deleteIcon}
                                    onClick={(e) => handleDelete(index, "size", e)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 금액 행 */}
                      <div className={styles.tableRow}>
                        <div className={styles.fieldCell}>금액</div>
                        <div className={styles.valueCell}>
                          <div
                            className={`${styles.valueInput} ${!item.price && !isEditing(index, "price") ? styles.placeholder : ""}`}
                          >
                            {isEditing(index, "price") ? (
                              <div className={styles.editingContainer}>
                                <input
                                  type="text"
                                  value={getDisplayValue(item, "price", index)}
                                  onChange={(e) =>
                                    handleInputChange(index, "price", e.target.value)
                                  }
                                  className={styles.editInput}
                                  autoFocus
                                />
                                <div className={styles.editActions}>
                                  <img
                                    src={checkIcon}
                                    alt="저장"
                                    className={styles.saveButton}
                                    onClick={(e) => handleSave(index, "price", e)}
                                  />
                                  <img
                                    src={cancelIcon}
                                    alt="취소"
                                    className={styles.cancelButton}
                                    onClick={handleCancel}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{getDisplayValue(item, "price", index)}</span>
                                <div className={styles.actionIcons}>
                                  <img
                                    src={editIcon}
                                    alt="편집"
                                    className={styles.editIcon}
                                    onClick={(e) => handleEdit(index, "price", e)}
                                  />
                                  <img
                                    src={trashIcon}
                                    alt="삭제"
                                    className={styles.deleteIcon}
                                    onClick={(e) => handleDelete(index, "price", e)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.checkbox}>
                      {selectedItems.has(index) && (
                        <img src={checkIcon} alt="체크" className={styles.checkIcon} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>인식된 상품이 없습니다.</p>
              <button className={styles.retryButton} onClick={handleRetry}>
                다시 시도하기
              </button>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className={styles.bottomActions}>
            <div className={styles.selectionInfo}>
              선택된 상품 <span className={styles.selectionCount}>{selectedItems.size}</span>개
            </div>
            <button
              className={styles.addToClosetButton}
              onClick={handleAddToCloset}
              disabled={selectedItems.size === 0}
            >
              옷장에 등록
            </button>
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
          variant="default"
        />
      </div>
    </div>
  );
};

export default OcrResultPage;
