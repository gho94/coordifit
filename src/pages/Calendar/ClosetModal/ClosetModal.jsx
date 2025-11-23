import styles from "./ClosetModal.module.css";
import classNames from "classnames/bind";

import { useCategoryQuery } from "@/hooks/useCommonCodeQuery";
import { useClothesQuery } from "@/hooks/useClothesQuery";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/constants/category";
import { CLOSET_TABS } from "@/pages/ClosetPage/closetData";
import { useAllCoordisQuery } from "@/hooks/useCoordiQuery";
import { IoClose } from "react-icons/io5";

const cn = classNames.bind(styles);

const ClosetModal = ({ onRemove, onAdd, clothes, onClose, isOpen }) => {
  const [activeTab, setActiveTab] = useState("clothes");
  const [mainCategory, setMainCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const isCoordiTab = activeTab === "coordi";

  const { data: coordis = { data: [] } } = useAllCoordisQuery();

  const {
    data: categories,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    error: categoryError,
  } = useCategoryQuery();

  const {
    data: clothesItems = [],
    isLoading: isClothesLoading,
    isError: isClothesError,
    error: clothesError,
  } = useClothesQuery({
    select: (res) =>
      res?.data?.map((item) => ({
        name: item.name,
        brand: item.brand,
        categoryCode: item.categoryCode,
        categoryName: CATEGORIES[item.categoryCode]?.ko ?? "기타",
        clothesId: item.clothesId,
        imageUrl: item.imageUrl,
      })) ?? [],
  });

  useEffect(() => {
    if (isCategoryError) console.error("❌ 카테고리 로드 오류:", categoryError);
    if (isClothesError) console.error("❌ 옷 정보 로드 오류:", clothesError);
  }, [isCategoryError, isClothesError, categoryError, clothesError]);

  const mainCategories = categories?.mainCategories ?? [];
  const subCategoriesMap = categories?.subCategoriesMap ?? {};

  const subCategories = mainCategory === "all" ? [] : subCategoriesMap[mainCategory];

  const filteredItems = useMemo(() => {
    // 메인 카테고리 선택하지 않으면 전체 아이템 조회
    if (mainCategory === "all") {
      return clothesItems;
    }

    // 서브카테고리 선택시 해당 아이템으로 필터링
    if (subCategory !== "all") {
      return clothesItems.filter((item) => item.categoryCode === subCategory);
    }

    const subCategoryCodes = subCategories.map((sub) => sub.codeId);
    return clothesItems.filter((item) => subCategoryCodes.includes(item.categoryCode));
  }, [clothesItems, mainCategory, subCategory, subCategories]);

  const isLoading = isCategoryLoading || isClothesLoading;

  const handleClickTab = (e) => setActiveTab(e.target.id);
  const handleClickCategory = (e) => {
    const [type, categoryId] = e.target.id.split("-");

    if (type === "main") {
      setMainCategory(categoryId);
      setSubCategory("all");
    } else {
      setSubCategory(categoryId);
    }
  };

  return (
    <>
      {isOpen && <div className={cn("sheetOverlay")} onClick={() => onClose(false)} />}
      <div className={cn("sheet", { sheetOpen: isOpen })}>
        <section className={cn("tabBar")}>
          {CLOSET_TABS.map((tab) => (
            <button
              id={tab.id}
              key={tab.id}
              type="button"
              className={cn("tabButton", { activeTab: activeTab === tab.id })}
              onClick={handleClickTab}
            >
              {tab.label}
            </button>
          ))}
        </section>
        {/* 카테고리 선택 탭 */}
        {!isCoordiTab && (
          <section className={cn("categories")}>
            <div className={cn("categoryHeader")}>
              <div className={cn("categoryMainList")}>
                {mainCategories.map((cat) => {
                  return (
                    <button
                      id={`main-${cat.codeId}`}
                      key={cat.codeId}
                      type="button"
                      className={cn("categoryButton", {
                        activeCategory: mainCategory === cat.codeId,
                      })}
                      onClick={handleClickCategory}
                    >
                      {cat.codeName}
                    </button>
                  );
                })}
              </div>
            </div>

            {mainCategory !== "all" ? (
              <div className={cn("subCategoryList")}>
                {subCategories.map((sub) => (
                  <button
                    id={`sub-${sub.codeId}`}
                    key={sub.codeId}
                    type="button"
                    className={cn("subCategoryButton", {
                      activeSubCategory: subCategory === sub.codeId,
                    })}
                    onClick={handleClickCategory}
                  >
                    {sub.codeName}
                  </button>
                ))}
              </div>
            ) : (
              <div className={cn("emptySubCategory")}></div>
            )}
          </section>
        )}
        <div className={cn("sheetBody", { coordiTab: isCoordiTab })}>
          {isLoading && <div className={cn("loading")}>불러오는 중…</div>}
          <div className={cn("closetGrid")}>
            {isCoordiTab ? (
              <>
                {coordis.data.map((coordi) => {
                  const itemList = JSON.parse(coordi.canvasJson);

                  return (
                    <button
                      key={coordi.coordiId}
                      className={cn("closetCard")}
                      onClick={() => {
                        itemList.forEach((clothes) => {
                          const parseCoordiItem = {
                            clothesId: clothes.clothesId,
                            categoryCode: clothes.categoryCode,
                            categoryName: CATEGORIES[clothes.categoryCode].ko,
                            imageUrl: clothes.imageUrl,
                            name: clothes.name,
                            width: clothes.width,
                            height: clothes.height,
                            x: clothes.x,
                            y: clothes.y,
                            rotation: clothes.rotation,
                          };

                          onAdd(parseCoordiItem);
                        });
                      }}
                    >
                      <div className={cn("closetFrame")}>
                        <img
                          src={coordi.thumbImageUrl}
                          alt={coordi.coordiName}
                          className={cn("closetImg")}
                        />
                      </div>

                      <div className={cn("closetInfo")}>
                        <div className={cn("closetName")}>{coordi.coordiName}</div>
                        <div className={cn("closetCat")}>
                          {coordi.description ? coordi.description : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                {filteredItems.map((item) => {
                  const isAdded = clothes.some((c) => c.clothesId === item.clothesId);

                  return (
                    <button
                      key={item.clothesId}
                      className={cn("closetCard", { activeCard: isAdded })}
                      onClick={() => {
                        if (isAdded) {
                          onRemove(item.clothesId);
                        } else {
                          onAdd(item);
                        }
                      }}
                    >
                      <div className={cn("closetFrame")}>
                        <img src={item.imageUrl} alt={item.name} className={cn("closetImg")} />
                      </div>
                      <div className={cn("closetInfo")}>
                        <div className={cn("closetName")}>{item.name}</div>
                        <div className={cn("closetCat")}>{item.categoryName}</div>
                      </div>
                      {isAdded && <div className={cn("badge")}>추가됨</div>}
                    </button>
                  );
                })}
              </>
            )}
          </div>
          {/* 캔버스에 선택된 아이템 목록 */}
          <div className={cn("selectedBar")}>
            {clothes.length === 0 ? (
              <div className={cn("selectedEmpty")}>아직 추가된 아이템이 없어요</div>
            ) : (
              <ul className={cn("selectedList")}>
                {clothes.map((item) => (
                  <li key={item.clothesId} className={cn("selectedItem")}>
                    <button
                      className={cn("removeBtn")}
                      onClick={() => onRemove(item.clothesId)}
                      aria-label="아이템 제거"
                    >
                      <IoClose size={12} />
                    </button>
                    <div className={cn("selectedThumbWrap")}>
                      <img src={item.imageUrl} alt={item.name} className={cn("selectedThumb")} />
                    </div>
                    <div className={cn("selectedMeta")}>
                      <span className={cn("selectedName")}>{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClosetModal;
