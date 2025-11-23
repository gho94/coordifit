import { useNavigate } from "react-router-dom";
import styles from "./AddItemModal.module.css";
import clothsenrollIcon from "@/assets/images/clothsenroll.png";
import paymentIcon from "@/assets/images/payment.png";

const AddItemModal = ({ onClose, position = "bottom" }) => {
  const navigate = useNavigate();

  const handleManualRegister = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate("/closet/register");
  };

  const handleOcrRegister = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate("/closet/ocr");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div
        className={`${styles.popup} ${position === "fab" ? styles.fabPosition : styles.cardPosition}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          className={styles.option}
          onMouseDown={(e) => {
            console.log("🔴 수기등록 버튼 onMouseDown!");
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            console.log("🔴 수기등록 버튼 클릭됨!");
            e.preventDefault();
            e.stopPropagation();
            handleManualRegister(e);
          }}
        >
          <div className={styles.optionIcon}>
            <img src={clothsenrollIcon} alt="옷 수기등록" />
          </div>
          <span className={styles.optionText}>옷 수기등록</span>
        </button>

        <button
          type="button"
          className={styles.option}
          onMouseDown={(e) => {
            console.log("🔵 OCR등록 버튼 onMouseDown!");
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            console.log("🔵 OCR등록 버튼 클릭됨!");
            e.preventDefault();
            e.stopPropagation();
            handleOcrRegister(e);
          }}
        >
          <div className={styles.optionIcon}>
            <img src={paymentIcon} alt="결제내역 등록" />
          </div>
          <span className={styles.optionText}>결제내역 등록</span>
        </button>
      </div>
    </div>
  );
};

export default AddItemModal;
