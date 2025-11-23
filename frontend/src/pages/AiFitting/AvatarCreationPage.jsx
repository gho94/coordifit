// src/pages/AiFitting/AvatarCreationPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import styles from "./AvatarCreationPage.module.css";
import imagePlusIcon from "@/assets/images/imageplusicon.png";
import galleryIcon from "@/assets/images/galaryicon.png";
import cameraIcon from "@/assets/images/cameraicon.png";
import { useAiFittingStore } from "@/stores/aiFittingStore.js";

const AvatarCreationPage = () => {
  const navigate = useNavigate();
  const createAvatar = useAiFittingStore((state) => state.createAvatar);

  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreviewUrl(objectUrl);
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim() || !file || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await createAvatar({
        avatarFile: file,
        avatarName: name.trim(),
      });

      if (created?.id) {
        navigate("/ai-fitting/avatars");
      }
    } catch (error) {
      console.error("❌ Failed to create avatar", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmittable = Boolean(name.trim() && file && !isSubmitting);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <input
          type="text"
          className={styles.nameInput}
          placeholder="아바타 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className={styles.subtitle}>사진을 업로드하여 나만의 아바타를 만들어보세요.</p>
      </header>

      <div className={styles.uploadCard}>
        <div className={styles.uploadVisual}>
          {previewUrl ? (
            <img src={previewUrl} alt="새 아바타 미리보기" className={styles.previewImage} />
          ) : (
            <div className={styles.iconCircle}>
              <img src={imagePlusIcon} alt="upload icon" className={styles.uploadIconOnly} />
            </div>
          )}
        </div>
        <span className={styles.uploadTitle}>사진 업로드</span>
        <p className={styles.uploadDescription}>
          갤러리에서 사진을 선택하거나 <br />
          새로 촬영하세요.
        </p>

        <div className={styles.uploadActions}>
          <button
            type="button"
            className={clsx(styles.uploadButton, styles.galleryButton)}
            onClick={() => galleryInputRef.current?.click()}
          >
            <img src={galleryIcon} alt="" className={styles.buttonIcon} />
            갤러리에서 선택
          </button>

          <button
            type="button"
            className={clsx(styles.uploadButton, styles.cameraButton)}
            onClick={() => cameraInputRef.current?.click()}
          >
            <img src={cameraIcon} alt="" className={styles.buttonIcon} />
            카메라로 촬영
          </button>
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => navigate("/ai-fitting/avatars")}
        >
          돌아가기
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!isSubmittable}
          onClick={handleSubmit}
        >
          {isSubmitting ? "등록 중..." : "아바타 등록"}
        </button>
      </div>
    </div>
  );
};

export default AvatarCreationPage;
