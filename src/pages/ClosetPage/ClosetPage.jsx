import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import clsx from "clsx";
import styles from "./ClosetPage.module.css";
import CommonCodeService from "@/services/commonCodeService";
import clothesService from "@/services/clothesService";
import { useAllCoordisQuery } from "@/hooks/useCoordiQuery";
import AddItemModal from "@/components/AddItemModal/AddItemModal";
import clothsenrollIcon from "@/assets/images/clothsenroll.png";
import paymentIcon from "@/assets/images/payment.png";
import { deleteCoordis } from "@/services/coordiService";
import noAiImage from "@/assets/icons/ai_default.png";
import CoordiViewMode from "../Closet/CoordiViewMode/CoordiViewMode";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

const ClosetPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const addCardRef = useRef(null);

  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState("clothes");

  const [mainCategories, setMainCategories] = useState([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [mainCategory, setMainCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");

  const [clothesItems, setClothesItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState("my");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState("bottom");
  const sortRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();
  const { data: coordi = { data: [] } } = useAllCoordisQuery();

  const [sortType, setSortType] = useState(() => {
    return localStorage.getItem("closet_sortType") || "purchase";
  });

  useEffect(() => {
    localStorage.setItem("closet_sortType", sortType);
  }, [sortType]);

  const sortedCoordi = useMemo(() => {
    if (!coordi?.data) return [];
    return sortType === "oldest" ? [...coordi.data].reverse() : coordi.data;
  }, [coordi.data, sortType]);

  // Handle clicks outside addCard to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isAddModalOpen && addCardRef.current && !addCardRef.current.contains(event.target)) {
        setIsAddModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddModalOpen]);

  useEffect(() => {
    const fetchTabs = async () => {
      try {
        const response = await CommonCodeService.getCommonCodesByParentCodeId("B10002");
        if (response.success && response.data) {
          const tabsData = response.data.map((tab) => ({
            id: tab.codeId,
            label: tab.codeName,
          }));

          setTabs(tabsData);

          if (tabsData.length > 0) {
            setActiveTab(tabsData[0].id);
          }
        }
      } catch (err) {
        console.error("탭 데이터 로드 실패:", err);
      }
    };
    fetchTabs();
  }, []);

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

  // MainPage에서 전달받은 카테고리 정보 처리
  useEffect(() => {
    if (location.state && mainCategories.length > 0) {
      const { selectedMainCategory, selectedSubCategory } = location.state;

      // 메인 카테고리 설정
      if (selectedMainCategory && selectedMainCategory !== "all") {
        const validMainCategory = mainCategories.find((cat) => cat.codeId === selectedMainCategory);
        if (validMainCategory) {
          setMainCategory(selectedMainCategory);

          // 서브 카테고리 설정
          if (selectedSubCategory && selectedSubCategory !== "all") {
            const subCategories = subCategoriesMap[selectedMainCategory] || [];
            const validSubCategory = subCategories.find(
              (sub) => sub.codeId === selectedSubCategory,
            );
            if (validSubCategory) {
              setSubCategory(selectedSubCategory);
            }
          }
        }
      }
    }

    if (location.state?.isCoordiTab) {
      setActiveTab("B20007");
    }
  }, [location.state, mainCategories, subCategoriesMap]);

  useEffect(() => {
    const fetchClothes = async () => {
      try {
        setLoading(true);
        const response = await clothesService.getUserClothes();
        if (response.success && response.data) {
          setClothesItems(response.data);
        } else {
          setClothesItems([]);
          console.error("옷 목록 조회 실패:", response.message);
        }
      } catch (err) {
        console.error("옷 목록 조회 실패:", err);
        setClothesItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClothes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // sortRef.current가 존재하고, 클릭한 요소가 내부에 없다면 닫기
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };

    // 드롭다운이 열릴 때만 이벤트 추가
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortOpen]);

  const handleSelectMode = () => {
    setIsSelecting((prev) => !prev);
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const handleClothesAddClick = () => {
    setModalPosition("card");
    setIsAddModalOpen(true);
  };

  const handleFabClick = () => {
    setModalPosition("fab");
    setIsAddModalOpen(true);
  };

  const handleManualRegister = () => {
    navigate("/closet/register");
    setIsAddModalOpen(false);
  };

  const handleOcrRegister = () => {
    navigate("/closet/ocr");
    setIsAddModalOpen(false);
  };

  const handleClothesClick = (item) => {
    if (isSelecting) {
      toggleItemSelection(item.clothesId);
      return;
    }
    // TODO: 상세 페이지로 이동
    navigate(`/closet/item/${item.clothesId}`);
  };

  const handleCoordiClick = (item) => {
    if (isSelecting) {
      toggleItemSelection(item.coordiId);
      return;
    }

    if (viewMode === "ai" && !item.aiImageUrl) {
      const clothesItems = JSON.parse(item.canvasJson).map((obj) => ({
        clothesId: obj.clothesId,
        imageUrl: obj.imageUrl,
        name: obj.name,
        categoryCode: obj.categoryCode,
      }));

      navigate("/ai-fitting", {
        state: {
          coordiId: item.coordiId,
          clothesItems: clothesItems,
        },
      });
    } else {
      navigate(`/closet/coordi/${item.coordiId}`);
    }
  };

  const handleClickCoordiEditor = () => {
    navigate("/closet/coordi/editor");
  };

  const handleDelete = () => {
    if (!selectedItems.length) return;
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    try {
      let response;
      if (isCoordiTab) {
        response = await deleteCoordis(selectedItems);

        console.log("삭제후 응답", response);
      } else {
        response = await clothesService.bulkDeleteClothes(selectedItems);
      }

      if (response.success) {
        setErrorMessage("선택한 아이템이 삭제되었습니다.");
        setShowErrorModal(true);
        if (isCoordiTab) {
          setClothesItems((prev) => prev.filter((item) => !selectedItems.includes(item.coordiId)));
          queryClient.invalidateQueries(["coordis"]);
        } else {
          setClothesItems((prev) => prev.filter((item) => !selectedItems.includes(item.clothesId)));
          queryClient.invalidateQueries(["coordis"]);
        }
        setSelectedItems([]);
        setIsSelecting(false);
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

  const handleCategoryChange = (id) => {
    setMainCategory(id);
    setSubCategory("all");
  };

  const handleSubCategoryChange = (id) => {
    setSubCategory(id);
  };

  const filteredItems = useMemo(() => {
    let result = clothesItems.filter((item) => {
      if (mainCategory === "all") return true;

      if (subCategory !== "all") return item.categoryCode === subCategory;

      const subCategoriesForMain = subCategoriesMap[mainCategory] || [];
      const subCategoryCodes = subCategoriesForMain.map((sub) => sub.codeId);
      return subCategoryCodes.includes(item.categoryCode);
    });

    result = [...result].sort((a, b) => {
      if (sortType === "purchase") {
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
      }
      if (sortType === "recent") {
        return new Date(b.lastWornDate) - new Date(a.lastWornDate);
      }
      if (sortType === "wear") {
        return (b.wearCount || 0) - (a.wearCount || 0);
      }
      return 0;
    });

    return result;
  }, [clothesItems, mainCategory, subCategory, subCategoriesMap, sortType]);
  const isCoordiTab = activeTab === "B20007";

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>옷 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* TODO: 탭바 데이터 연결 */}
      <section className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={clsx(styles.tabButton, activeTab === tab.id && styles.activeTab)}
            onClick={() => {
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </section>
      {/* TODO: 카테고리 데이터 연결 */}
      {!isCoordiTab && (
        <section className={styles.categories}>
          <div className={styles.categoryHeader}>
            <div className={styles.categoryMainList}>
              {mainCategories.map((cat) => (
                <button
                  key={cat.codeId}
                  type="button"
                  className={clsx(
                    styles.categoryButton,
                    mainCategory === cat.codeId && styles.activeCategory,
                  )}
                  onClick={() => handleCategoryChange(cat.codeId)}
                >
                  {cat.codeName}
                </button>
              ))}
            </div>
          </div>

          {mainCategory !== "all" && (
            <div className={styles.subCategoryList}>
              {(subCategoriesMap[mainCategory] || []).map((sub) => (
                <button
                  key={sub.codeId}
                  type="button"
                  className={clsx(
                    styles.subCategoryButton,
                    subCategory === sub.codeId && styles.activeSubCategory,
                  )}
                  onClick={() => handleSubCategoryChange(sub.codeId)}
                >
                  {sub.codeName}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {isCoordiTab && <CoordiViewMode viewMode={viewMode} onClickViewMode={setViewMode} />}
      <div className={clsx(styles.utilityRow, isCoordiTab && styles.coordiUtilRow)}>
        <button
          type="button"
          className={clsx(styles.selectToggle, isSelecting && styles.cancelSelect)}
          onClick={handleSelectMode}
        >
          <span className={styles.toggleIcon} aria-hidden />
          {isSelecting ? "취소하기" : "선택하기"}
        </button>
        {isSelecting ? (
          <div className={styles.selectionStatus}>
            <span className={styles.selectionBadge} aria-hidden />
            <span className={styles.selectionText}>{selectedItems.length}개 선택됨</span>
          </div>
        ) : (
          <div className={styles.selectionPlaceholder} />
        )}
        <div ref={sortRef} className={styles.sortWrapper}>
          <button
            type="button"
            className={clsx(styles.sortButton, isCoordiTab && styles.coordiSort)}
            onClick={() => setIsSortOpen((prev) => !prev)}
          >
            {isCoordiTab
              ? sortType === "newest"
                ? "최근 생성순"
                : "오래된 생성순"
              : sortType === "purchase"
                ? "구매일순"
                : sortType === "wear"
                  ? "입은 횟수순"
                  : "최근 착용순"}
            <span className={styles.sortArrow} aria-hidden />
          </button>

          {isSortOpen &&
            (isCoordiTab ? (
              <ul className={styles.sortDropdown}>
                <li
                  className={clsx(styles.sortOption, sortType === "newest" && styles.activeSort)}
                  onClick={() => {
                    setSortType("newest");
                    setIsSortOpen(false);
                  }}
                >
                  최근 생성순
                </li>
                <li
                  className={clsx(styles.sortOption, sortType === "oldest" && styles.activeSort)}
                  onClick={() => {
                    setSortType("oldest");
                    setIsSortOpen(false);
                  }}
                >
                  오래된 생성순
                </li>
              </ul>
            ) : (
              <ul className={styles.sortDropdown}>
                <li
                  className={clsx(styles.sortOption, sortType === "recent" && styles.activeSort)}
                  onClick={() => {
                    setSortType("recent");
                    setIsSortOpen(false);
                  }}
                >
                  최근착용순
                </li>
                <li
                  className={clsx(styles.sortOption, sortType === "wear" && styles.activeSort)}
                  onClick={() => {
                    setSortType("wear");
                    setIsSortOpen(false);
                  }}
                >
                  입은횟수순
                </li>
                <li
                  className={clsx(styles.sortOption, sortType === "purchase" && styles.activeSort)}
                  onClick={() => {
                    setSortType("purchase");
                    setIsSortOpen(false);
                  }}
                >
                  구매일순
                </li>
              </ul>
            ))}
        </div>
      </div>

      <section className={styles.gridSection}>
        <div className={styles.grid}>
          {isCoordiTab ? (
            <>
              {sortedCoordi.map((item) => {
                const imageSrc =
                  viewMode === "ai"
                    ? item.aiImageUrl || noAiImage
                    : item.thumbImageUrl || noAiImage;
                const aiImageStyle = item.aiImageUrl
                  ? styles.cardImageAi
                  : styles.cardDefaultImageAi;
                return (
                  <article
                    key={item.coordiId}
                    className={clsx(styles.card, isSelecting && styles.cardSelectable)}
                    onClick={() => handleCoordiClick(item)}
                  >
                    <div className={styles.cardImageWrapper}>
                      <img
                        src={imageSrc}
                        alt={item.coordiName}
                        className={viewMode === "ai" ? aiImageStyle : styles.cardImage}
                      />
                      {viewMode === "ai" && !item.aiImageUrl && (
                        <button
                          type="button"
                          className={styles.addAiButton}
                          onClick={() => handleCoordiClick(item)}
                        >
                          AI 피팅 추가하기
                        </button>
                      )}
                      {isSelecting && (
                        <span
                          className={clsx(
                            styles.checkbox,
                            selectedItems.includes(item.coordiId) && styles.checkboxChecked,
                          )}
                        />
                      )}
                    </div>
                    <div className={styles.cardContent}>
                      <p className={`${styles.cardName} ${styles.coordiCardName}`}>
                        {item.coordiName}
                      </p>
                    </div>
                  </article>
                );
              })}
              <article
                className={clsx(
                  styles.card,
                  isCoordiTab && `${styles.cardSelectable} ${styles.coordiAddCard}`,
                )}
              >
                <button
                  type="button"
                  className={clsx(styles.addCardButton)}
                  onClick={handleClickCoordiEditor}
                >
                  <span className={styles.addIcon}>＋</span>
                  <span className={styles.addLabel}>아이템 추가</span>
                </button>
              </article>
            </>
          ) : (
            <>
              {filteredItems.map((item) => (
                <article
                  key={item.clothesId}
                  className={clsx(styles.card, isSelecting && styles.cardSelectable)}
                  onClick={() => handleClothesClick(item)}
                >
                  <div className={styles.cardImageWrapper}>
                    <img
                      src={item.imageUrl || "/noimage.png"}
                      alt={item.name}
                      className={styles.cardImage}
                    />
                    {isSelecting && (
                      <span
                        className={clsx(
                          styles.checkbox,
                          selectedItems.includes(item.clothesId) && styles.checkboxChecked,
                        )}
                      />
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <p className={styles.cardName}>{item.name}</p>
                    {item.purchaseDate && <p className={styles.cardMeta}>{item.purchaseDate}</p>}
                  </div>
                </article>
              ))}
            </>
          )}
          {!isCoordiTab && (
            <div className={styles.addCard} ref={addCardRef}>
              {isAddModalOpen && modalPosition === "card" ? (
                <div className={styles.addCardOptions}>
                  <button
                    type="button"
                    className={styles.addCardOption}
                    onClick={handleManualRegister}
                  >
                    <div className={styles.addCardOptionIcon}>
                      <img src={clothsenrollIcon} alt="옷 수기등록" />
                    </div>
                    <span className={styles.addCardOptionText}>옷 수기등록</span>
                  </button>
                  <button
                    type="button"
                    className={styles.addCardOption}
                    onClick={handleOcrRegister}
                  >
                    <div className={styles.addCardOptionIcon}>
                      <img src={paymentIcon} alt="결제내역 등록" />
                    </div>
                    <span className={styles.addCardOptionText}>결제내역 등록</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.addCardButton}
                  onClick={handleClothesAddClick}
                >
                  <span className={styles.addIcon}>＋</span>
                  <span className={styles.addLabel}>아이템 추가</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Button */}
      {!isCoordiTab && !isSelecting && (
        <button
          type="button"
          className={styles.fab}
          onClick={handleFabClick}
          aria-label="아이템 추가"
        >
          ＋
        </button>
      )}
      {/* 삭제 버튼 */}
      {isSelecting && selectedItems.length > 0 && (
        <button type="button" className={styles.deletePill} onClick={handleDelete}>
          <span className={styles.deleteIcon} aria-hidden />
          삭제
        </button>
      )}
      {isCoordiTab && !isSelecting && (
        <button className={styles.addButton} onClick={handleClickCoordiEditor}>
          + 코디 추가하기
        </button>
      )}
      {/* Add Item Modal for FAB */}
      {isAddModalOpen && modalPosition === "fab" && (
        <AddItemModal onClose={() => setIsAddModalOpen(false)} position={modalPosition} />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="삭제 확인"
        message={`선택한 ${selectedItems.length}개 아이템을 삭제하시겠습니까?`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

      {/* 오류/성공 모달 */}
      <ConfirmModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title={errorMessage.includes("삭제되었습니다") ? "완료" : "오류"}
        message={errorMessage}
        confirmText="확인"
        cancelText=""
      />
    </div>
  );
};

export default ClosetPage;
