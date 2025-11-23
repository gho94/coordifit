import { useEffect, useMemo, useRef, useState } from "react";
import { useBeforeUnload, useNavigate, useParams } from "react-router-dom";

import { Layer, Rect, Stage } from "react-konva";
import { useQueryClient } from "@tanstack/react-query";

import { useDailyLookByDateQuery } from "@/hooks/useDailyLookQuery";
import { api } from "@/services/axiosInstance";

import ItemCarousel from "@/components/ItemCarousel/ItemCarousel";
import ClosetModal from "@calendar/ClosetModal/ClosetModal";
import CanvasItem from "@calendar/CanvasItem/CanvasItem";
import Button from "@/components/Button/Button";
import Modal from "@/components/Modal/Modal";

import styles from "./CalendarEditor.module.css";
import { CANVAS_CONFIG } from "@/constants/calendar";
import { useClothesStore } from "@/stores/clothesStore";
import { useLeaveConfirm } from "@/hooks/useLeaveConfirm";
import { getCanvasPosition } from "@/utils/canvasUtils";
import { formatDateString } from "@/utils/calendarUtils";
import Weather from "../Weather/Weather";
import classNames from "classnames/bind";

const cn = classNames.bind(styles);

const CalendarEditor = () => {
  const [closetModal, setClosetModal] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [selectedId, setSelectedId] = useState(null);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatusMap, setLoadStatusMap] = useState({});
  const [errors, setErrors] = useState({ desc: "" });

  const pastClothesRef = useRef([]);
  const stageRef = useRef(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { date } = useParams();

  const { open, confirm, cancel } = useLeaveConfirm(!isSaving && isDirty);

  const { clothes, setClothes, updateClothes, addClothes, removeClothes, clearClothes } =
    useClothesStore();
  const { data: dailyLook = { data: {} } } = useDailyLookByDateQuery(date);

  const isExisting = useMemo(() => {
    const d = dailyLook?.data || {};
    return Boolean(d.dailyLookId ?? d.dailylookId); // 하나라도 있으면 기존 레코드 존재
  }, [dailyLook]);

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
    if (dailyLook?.data?.canvasJson) {
      const pastClothes = JSON.parse(dailyLook.data.canvasJson);

      pastClothesRef.current = pastClothes;
      setClothes(pastClothes);
      setDescription(dailyLook.data.description || "");
    }
  }, [dailyLook]);

  useEffect(() => {
    const sameClothes = JSON.stringify(pastClothesRef.current) === JSON.stringify(clothes);
    const sameDesc = (dailyLook?.data?.description || "") === description;

    const dirtyNow = !(sameClothes && sameDesc);

    setIsDirty((prev) => (prev !== dirtyNow ? dirtyNow : prev));
  }, [clothes, description, dailyLook?.data?.description]);

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

      addClothes(konvaObject);
      setSelectedId(konvaObject.clothesId);
    };
  };

  const removeSelected = () => {
    if (!selectedId) return;
    removeClothes(selectedId);
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
        const fileName = `look-${date}-${Date.now()}.png`;

        formData.append("image", blob, fileName);
        formData.append("description", description);
        formData.append("items", JSON.stringify(clothes));

        const method = isExisting ? api.put : api.post;
        await method(`/daily-look/date/${date}`, formData);

        pastClothesRef.current = clothes;
        setIsDirty(false);
        clearClothes();

        setTimeout(() => {
          navigate(`/calendar/${date}`);
        }, 0);

        setTimeout(() => {
          queryClient.invalidateQueries(["dailyLook", date]);
          queryClient.invalidateQueries(["dailyLooks", date.slice(0.7)]);
        }, 0);

        setSelectedId(prev);
      } finally {
        setIsSaving(false);
      }
    });
  };

  return (
    <div className={cn("wrapper")}>
      <div className={cn("header-wrapper")}>
        <header className={cn("header")}>
          <span className={cn("headerTitle")}>{formatDateString(date)}</span>
          <Weather targetDate={new Date(date)} />
        </header>
      </div>
      <div className={cn("content-box")}>
        <div className={cn("editorRow")}>
          {isLoading && (
            <div className={cn("canvas-loading-center")}>
              <div className={cn("loading-blur-box")}>
                <div className={cn("spinner")} />
                <p className={cn("loading-text")}>이미지 추가 중...</p>
              </div>
            </div>
          )}
          <div className={cn("label-wrapper")}>
            <label htmlFor="coordiName" className={cn("inputLabel")}>
              데일리룩 설명
            </label>
            <span className={cn("charCounter", description.length > 60 && "error")}>
              {description.length} / 60자
            </span>
          </div>
          <textarea
            type="text"
            name="description"
            className={cn("descInput", errors.desc && "error")}
            value={description}
            placeholder="데일리룩의 특징이나 설명을 입력하세요 (최대 60자)"
            rows={2}
            maxLength={100}
            onChange={(e) => {
              const inputText = e.target.value;

              setDescription(inputText);
              setErrors((prev) => ({
                ...prev,
                desc: inputText.length > 60 ? "설명은 60자 이내로 입력해주세요." : "",
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
          <div className={cn("canvasCard")}>
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
                {clothes.map((item) => (
                  <CanvasItem
                    key={item.clothesId}
                    obj={item}
                    isSelected={item.clothesId === selectedId}
                    onSelect={() => setSelectedId(item.clothesId)}
                    onChange={(next) => updateClothes(item.clothesId, next)}
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
              <button className={cn("btnDanger", { hidden: !selectedId })} onClick={removeSelected}>
                옷 지우기
              </button>
            </div>
          </div>
          <button
            className={cn("fab")}
            onClick={(e) => {
              e.stopPropagation();
              setClosetModal(true);
            }}
          >
            +
          </button>
        </div>
        <ItemCarousel items={clothes} selectedId={selectedId} onClick={setSelectedId} />
        <ClosetModal
          isOpen={closetModal}
          onClose={setClosetModal}
          onAdd={addToCanvas}
          clothes={clothes}
          onRemove={removeClothes}
        />
      </div>
      <div className={cn("button-wrapper")}>
        <>
          <Button
            onClick={saveImage}
            style="default"
            disabled={isSaving || clothes.length === 0 || description.length > 60}
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              clearClothes();
              navigate(-1);
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
                  clearClothes();
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

export default CalendarEditor;
