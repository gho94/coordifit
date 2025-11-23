import { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message = "정말로 실행하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  variant = "default", // "default" | "danger"
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          {cancelText && (
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`${styles.confirmButton} ${
              variant === "danger" ? styles.confirmButtonDanger : ""
            }`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
