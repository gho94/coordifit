import { useNavigate, useParams } from "react-router-dom";
import styles from "./CalendarDetail.module.css";
import ItemCarousel from "@/components/ItemCarousel/ItemCarousel";
import Button from "@/components/Button/Button";
import { useDailyLookByDateQuery } from "@/hooks/useDailyLookQuery";
import emptyImage from "@/assets/images/empty_image.png";

import classNames from "classnames/bind";
import { deleteDailyLookByDate } from "@/services/dailyLookApi";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/utils/calendarUtils";
import DescriptionBox from "../DescriptionBox/DescriptionBox";
import { useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";

const cx = classNames.bind(styles);

const CalendarDetail = () => {
  const queryClient = useQueryClient();
  const { date } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAddDailyLook = () => {
    navigate("editor");
  };

  const { data: dailyLook = { data: {} }, isLoading, isError } = useDailyLookByDateQuery(date);

  const handleDeleteClick = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleEditClick = () => {
    navigate("editor");
  };
  const handleConfirm = async () => {
    if (!dailyLook) {
      setErrorMessage("삭제할 데일리룩이 없습니다.");
      setShowErrorModal(true);
      return;
    } else {
      await deleteDailyLookByDate(date);

      queryClient.invalidateQueries(["dailyLook", date]);
      queryClient.invalidateQueries(["dailyLooks", formatDate(new Date(date))]);

      setShowSuccessModal(true);
    }
  };

  return (
    <div className={cx("container")}>
      {dailyLook?.data?.canvasJson ? (
        <>
          <label htmlFor="coordiName" className={cx("inputLabel")}>
            데일리룩 설명
          </label>
          <DescriptionBox description={dailyLook.data.description} />
          <div className={cx("wrapper")}>
            <img
              className={cx("image")}
              src={dailyLook.data.originImageUrl}
              alt="Daily Look Thumbnail"
            />
          </div>

          <ItemCarousel items={JSON.parse(dailyLook.data.canvasJson)} />
          <div className={cx("button-wrapper")}>
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
              message="이 데일리룩을 삭제하시겠습니까?"
              confirmText="삭제"
              cancelText="취소"
              variant="danger"
            />
          </div>
        </>
      ) : (
        <>
          <div className={cx("content")}>
            <img
              src={emptyImage}
              alt="비어 있는 데일리룩"
              className={cx("emptyImage")}
              draggable={false}
            />
            <p className={styles.message}>{"아직 등록된 데일리룩이 없어요."}</p>

            <Button size="large" onClick={handleAddDailyLook}>
              데일리룩 만들기
            </Button>
          </div>
        </>
      )}

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

      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/calendar");
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate("/calendar");
        }}
        title="삭제 완료"
        message="삭제가 완료되었습니다."
        confirmText="확인"
        cancelText=""
        variant="default"
      />
    </div>
  );
};

export default CalendarDetail;
