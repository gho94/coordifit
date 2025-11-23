import { useEffect, useRef } from "react";
import styles from "./BottomSheet.module.css";

const BottomSheet = ({ title, onClose, children, footer, height = "60vh", showHandle = true }) => {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // 터치/드래그 이벤트 핸들러
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // 아래로 드래그할 때만 모달을 따라 움직임
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;

    const diff = currentY.current - startY.current;
    const threshold = 100; // 100px 이상 드래그하면 닫기

    if (diff > threshold) {
      onClose();
    } else {
      // 원래 위치로 복원
      if (sheetRef.current) {
        sheetRef.current.style.transform = "translateY(0)";
      }
    }

    isDragging.current = false;
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div
        ref={sheetRef}
        className={styles.bottomSheet}
        style={{ height }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {showHandle && <div className={styles.handle} />}

        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
          </div>
        )}

        <div className={styles.content}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default BottomSheet;
