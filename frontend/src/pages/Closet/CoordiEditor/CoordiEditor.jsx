import { useEffect, useRef, useState } from "react";
import { useBeforeUnload, useLocation, useNavigate, useParams } from "react-router-dom";

import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames/bind";
import { Layer, Rect, Stage } from "react-konva";
import styles from "./CoordiEditor.module.css";
import { TbShirt } from "react-icons/tb";
import { FiImage } from "react-icons/fi";

import ItemCarousel from "@/components/ItemCarousel/ItemCarousel";
import Modal from "@/components/Modal/Modal";

import ClosetModal from "@/pages/Calendar/ClosetModal/ClosetModal";
import CanvasItem from "@/pages/Calendar/CanvasItem/CanvasItem";
import Button from "@/components/Button/Button";

import { useCoordiStore } from "@/stores/coordiStore";
import { useLeaveConfirm } from "@/hooks/useLeaveConfirm";
import { useCoordiByIdQuery } from "@/hooks/useCoordiQuery";
import { CANVAS_CONFIG } from "@/constants/calendar";
import { getCanvasPosition } from "@/utils/canvasUtils";
import { api } from "@/services/axiosInstance";
import aiIcon from "@/assets/icons/samsung_ai.webp";

const cn = classNames.bind(styles);
const MAX_NAME_LEN = 20;
const MAX_DESC_LEN = 60;

const CoordiEditor = () => {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [description, setDescription] = useState("");
  const [coordiName, setCoordiName] = useState("");
  const [errors, setErrors] = useState({ name: "", desc: "" });
  const [viewMode, setViewMode] = useState("coordi");

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatusMap, setLoadStatusMap] = useState({});
  const [aiExists, setAiExists] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState("");

  const pastClothesRef = useRef([]);
  const queryClient = useQueryClient();
  const stageRef = useRef(null);
  const navigate = useNavigate();
  const { coordiId } = useParams();
  const location = useLocation();

  const {
    coordiItems,
    setCoordiItems,
    addCoordiItem,
    removeCooridItem,
    updateCoordiItem,
    clearCoordiItems,
  } = useCoordiStore();

  const { open, confirm, cancel } = useLeaveConfirm(!isSaving && isDirty);

  const isCoordiNameValid = coordiName && coordiName.length <= 30;
  const isDescriptionValid = description && description.length <= 200;
  const isItemsValid = coordiItems.length > 0;
  const isDisabled = !(!isSaving && isItemsValid && isCoordiNameValid && isDescriptionValid);

  useBeforeUnload((e) => {
    if (!isSaving && isDirty) {
      e.preventDefault();
      e.returnValue = "";
    } else {
      clearCoordiItems();
      setDescription("");
      setCoordiName("");
      navigate("/closet", { state: { isCoordiTab: true } });
    }
  });

  const { data: coordi = { data: {} } } = useCoordiByIdQuery(coordiId);

  useEffect(() => {
    const statuses = Object.values(loadStatusMap);

    if (statuses.length === 0) {
      setIsLoading(false);
    } else if (statuses.every((s) => s === "loaded")) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [loadStatusMap]);

  useEffect(() => {
    if (coordi?.data?.canvasJson) {
      const pastClothes = JSON.parse(coordi.data.canvasJson);

      pastClothesRef.current = pastClothes;
      setCoordiItems(pastClothes);
      setDescription(coordi.data.description || "");
      setCoordiName(coordi.data.coordiName || "");
    }

    if (coordi?.data?.aiImageUrl) {
      setAiImageUrl(coordi?.data?.aiImageUrl);
      setAiExists(true);
    }
  }, [coordi]);

  useEffect(() => {
    const sameClothes = JSON.stringify(pastClothesRef.current) === JSON.stringify(coordiItems);
    const sameName = (coordi?.data?.coordiName || "") === coordiName;
    const sameDesc = (coordi?.data?.description || "") === description;
    const dirtyNow = !(sameClothes && sameDesc && sameName);

    setIsDirty((prev) => (prev !== dirtyNow ? dirtyNow : prev));
  }, [coordi, coordiItems, coordi?.data?.coordiName, coordi?.data?.description]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_NAME_LEN) {
      setErrors((prev) => ({
        ...prev,
        name: `제목은 ${MAX_NAME_LEN}자 이하로 입력해주세요.`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
    setCoordiName(value);
  };

  const isInvalid = !!errors.name || !!errors.desc || !coordiName.trim() || !description.trim();

  const handleDescChange = (e) => {
    const value = e.target.value;
    if (value.length > MAX_DESC_LEN) {
      setErrors((prev) => ({
        ...prev,
        desc: `상세 설명은 ${MAX_DESC_LEN}자 이하로 입력해주세요.`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, desc: "" }));
    }
    setDescription(value);
  };

  const handleLoadStatus = (id, status) => {
    setLoadStatusMap((prev) => ({ ...prev, [id]: status }));
  };

  const addToCanvas = (item) => {
    const isClosetItem = !item.instanceId;

    const position = isClosetItem
      ? getCanvasPosition(item.categoryCode)
      : { x: item.x, y: item.y, scale: item.scaleX };

    const img = new Image();
    img.src = item.imageUrl;
    img.onload = () => {
      let scale = position.scale ?? 1;

      if (isClosetItem) {
        const maxWidth = 350;
        if (img.width > maxWidth) {
          scale = (maxWidth / img.width) * scale;
        }
      }

      const konvaObject = {
        instanceId: `${item.clothesId}-${Date.now()}`,
        clothesId: item.clothesId,
        imageUrl: item.imageUrl,
        name: item.name,
        categoryCode: item.categoryCode,
        x: position.x,
        y: position.y,
        scaleX: scale,
        scaleY: scale,
        rotation: item.rotation ?? 0,
      };

      addCoordiItem(konvaObject);
      setSelectedId(konvaObject.clothesId);
    };
  };

  useEffect(() => {
    if (location.state?.dataUrl) {
      setAiExists(true);
      setAiImageUrl(location.state?.dataUrl);
    }

    if (location.state?.clothesItems && viewMode === "coordi") {
      location.state.clothesItems.forEach((itemData) => {
        addToCanvas(itemData.apiData);
      });
    }
  }, [location.state]);

  const removeSelected = () => {
    if (!selectedId) return;
    removeCooridItem(selectedId);
    setSelectedId(null);
  };

  const saveImage = async () => {
    if (!stageRef.current) return;

    setIsSaving(true);
    const prev = selectedId;
    setSelectedId(null);

    requestAnimationFrame(async () => {
      try {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const blob = await (await fetch(uri)).blob();
        const formData = new FormData();
        const fileName = `coordi-${Date.now()}.png`;

        formData.append("image", blob, fileName);
        formData.append("description", description);
        formData.append("coordiName", coordiName);
        formData.append("canvasJson", JSON.stringify(coordiItems));

        if (coordiId) {
          if (aiExists && !aiImageUrl) {
            const cleanBase64 = location.state.dataUrl.replace(/\s+/g, "");
            const dataUrl = `data:image/png;base64,${cleanBase64}`;

            await api.put(`/coordi/${coordiId}/ai-image`, {
              dataUrl,
            });
          } else {
            await api.put(`/coordi/${coordiId}`, formData);
          }
        } else {
          if (aiExists && aiImageUrl) {
            const cleanBase64 = location.state.dataUrl.replace(/\s+/g, "");
            const dataUrl = `data:image/png;base64,${cleanBase64}`;

            formData.append("dataUrl", dataUrl);
          }
          await api.post(`/coordi`, formData);
        }

        pastClothesRef.current = coordiItems;
        setIsDirty(false);
        clearCoordiItems();
        setCoordiName("");
        setDescription("");

        setTimeout(() => {
          navigate("/closet", { replace: true, state: { isCoordiTab: true } });
        }, 0);

        queryClient.invalidateQueries(["coordis"]);
        queryClient.invalidateQueries(["coordi"]);

        setSelectedId(prev);
      } finally {
        setIsSaving(false);
      }
    });
  };

  return (
    <div className={cn("wrapper")}>
      <div className={cn("headerWapper")}>
        <div className={cn("content-header")}>
          <div className={cn("header-left")}>
            <div className={cn("label-wrapper")}>
              <label htmlFor="coordiName" className={cn("inputLabel")}>
                코디 제목<span className={cn("requiredMark")}>*</span>
              </label>
              <span className={cn("charCounter", coordiName.length > 20 && "error")}>
                {coordiName.length} / 20자
              </span>
            </div>
            <div className={cn("inputWrapper")}>
              <input
                id="coordiName"
                type="text"
                className={cn("titleInput", errors.name && "error")}
                value={coordiName}
                placeholder="코디 제목을 입력하세요 (최대 20자)"
                onChange={(e) => {
                  const val = e.target.value;
                  setCoordiName(val);
                  setErrors((prev) => ({
                    ...prev,
                    name: val.length > 20 ? "제목은 20자 이내로 입력해주세요." : "",
                  }));
                }}
              />
              <div className={cn("counterRow")}>
                {errors.name ? (
                  <span className={cn("errorMsgInline")}>{errors.name}</span>
                ) : (
                  <div className={cn("emptyErrorMsg")} />
                )}
              </div>
            </div>
          </div>
          <div className={cn("view-toggle-wrapper")}>
            <div className={cn("view-toggle")} role="tablist" aria-label="보기 전환">
              <button
                role="tab"
                aria-selected={viewMode === "coordi"}
                className={cn("toggle-option", viewMode === "coordi" && "active")}
                onClick={() => setViewMode("coordi")}
                title="코디 아이템 보기"
              >
                <TbShirt className={cn("toggle-icon")} />
                <span className={cn("span")}>코디</span>
              </button>

              <button
                role="tab"
                aria-selected={viewMode === "ai"}
                className={cn(
                  "toggle-option",
                  "toggle-ai",
                  viewMode === "ai" && "active",
                  !aiExists && "empty", // 시각적으로 '없음' 상태 표시
                )}
                onClick={() => {
                  setViewMode("ai");
                  setIsLoading(false);
                }}
                title={aiExists ? "AI 피팅 이미지 보기" : "AI 피팅하러 가기"}
              >
                <img src={aiIcon} className={cn("toggle-icon")} />
                <span className={cn("span")}>AI 피팅</span>

                {aiExists ? (
                  <span className={cn("ai-badge", "ok")}>완료</span>
                ) : (
                  <span className={cn("ai-badge", "none")}>없음</span>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className={cn("inputGroup")}>
          <div className={cn("label-wrapper")}>
            <label htmlFor="description" className={cn("inputLabel")}>
              상세 설명
              <span className={cn("requiredMark")}>*</span>
            </label>
            <span className={cn("charCounter", description.length > 60 && "error")}>
              {description.length} / 60자
            </span>
          </div>

          <div className={cn("inputWrapper")}>
            <textarea
              type="text"
              name="description"
              className={cn("descInput", errors.desc && "error")}
              value={description}
              placeholder="코디 특징이나 설명을 입력하세요 (최대 60자)"
              rows={2}
              maxLength={60}
              onChange={(e) => {
                const val = e.target.value;
                const lines = val.split("\n");

                if (lines.length > 2) {
                  e.target.value = description;
                  return;
                }

                setDescription(val);
                setErrors((prev) => ({
                  ...prev,
                  desc: val.length > 60 ? "설명은 60자 이내로 입력해주세요." : "",
                }));
              }}
            />
            <div className={cn("counterRow")}>
              {errors.desc ? (
                <span className={cn("errorMsgInline")}>{errors.desc}</span>
              ) : (
                <div className={cn("emptyErrorMsg")} />
              )}
            </div>
          </div>
        </div>
        {isLoading && (
          <div className={cn("canvas-loading-center")}>
            <div className={cn("loading-blur-box")}>
              <div className={cn("spinner")} />
              <p className={cn("loading-text")}>이미지 추가 중...</p>
            </div>
          </div>
        )}
        <div className={cn("canvasCard")}>
          {viewMode === "coordi" ? (
            <>
              <Stage
                ref={stageRef}
                width={CANVAS_CONFIG.WIDTH}
                height={CANVAS_CONFIG.HEIGHT}
                className={cn("stage")}
              >
                <Layer>
                  <Rect
                    width={CANVAS_CONFIG.WIDTH}
                    height={CANVAS_CONFIG.HEIGHT}
                    fill={bgColor}
                    onMouseDown={() => setSelectedId(null)}
                    onTouchStart={() => setSelectedId(null)}
                  />
                </Layer>
                <Layer>
                  {coordiItems.map((item) => (
                    <CanvasItem
                      key={item.clothesId}
                      obj={item}
                      isSelected={item.clothesId === selectedId}
                      onSelect={() => setSelectedId(item.clothesId)}
                      onChange={(next) => updateCoordiItem(item.clothesId, next)}
                      onLoad={handleLoadStatus}
                    />
                  ))}
                </Layer>
              </Stage>
              <div className={cn("toolbar")}>
                <div className={cn("colors")}>
                  {CANVAS_CONFIG.PALLETTE.map((hexColor) => (
                    <button
                      key={hexColor}
                      className={cn("colorDot", { activeDot: bgColor === hexColor })}
                      onClick={() => setBgColor(hexColor)}
                      title={hexColor}
                      style={{ backgroundColor: hexColor }}
                    />
                  ))}
                </div>
                <button
                  className={cn("fab")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetOpen(true);
                  }}
                >
                  +
                </button>
                <div className={cn("actions")}>
                  <button
                    className={cn("btnDanger", { hidden: !selectedId })}
                    onClick={removeSelected}
                  >
                    옷 지우기
                  </button>
                </div>
              </div>
            </>
          ) : aiExists ? (
            <>
              <img
                src={
                  `data:image/png;base64,${aiImageUrl}` ||
                  `data:image/png;base64,${location.state?.dataUrl}`
                }
                alt="" // 장식용
                className={cn("aiLayer")}
              />
            </>
          ) : (
            <>
              <div className={cn("aiEmpty")}>
                <div className={cn("aiEmptyIcon")}>
                  <FiImage size="50" />
                </div>
                <p className={cn("aiEmptyTitle")}>AI 시착 이미지가 없습니다</p>
                <p className={cn("aiEmptySub")}>코디를 저장한 뒤 AI 이미지를 생성할 수 있어요.</p>
              </div>
            </>
          )}
        </div>
      </div>
      <ItemCarousel items={coordiItems} selectedId={selectedId} onClick={setSelectedId} />
      <ClosetModal
        isOpen={sheetOpen}
        onClose={setSheetOpen}
        onAdd={addToCanvas}
        clothes={coordiItems}
        onRemove={removeCooridItem}
      />
      <div className={styles["button-wrapper"]}>
        <>
          <Button onClick={saveImage} style="default" disabled={isDisabled}>
            저장하기
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              clearCoordiItems();
              setDescription("");
              setCoordiName("");
              navigate("/closet", { state: { isCoordiTab: true } });
            }}
            style="secondary"
          >
            뒤로가기
          </Button>
        </>
      </div>
      {open && (
        <Modal
          title="뒤로 가기"
          onClose={cancel}
          footer={
            <>
              <button type="button" onClick={cancel}>
                아니요
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCoordiItems();
                  setCoordiName("");
                  setDescription("");
                  confirm();
                }}
              >
                예
              </button>
            </>
          }
          children={"변경 사항이 저장되지 않았습니다.\n\n계속 이동할까요?"}
        />
      )}
    </div>
  );
};

export default CoordiEditor;
