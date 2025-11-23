import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import styles from "./AvatarSelectionPage.module.css";
import addAvatarIcon from "@/assets/images/enrollicon.png";
import circleXIcon from "@/assets/images/circle-x.png";
import { useAiFittingStore } from "@/stores/aiFittingStore.js";
import { useUserStore } from "@/stores/userStore.js";
import ConfirmModal from "@/components/ConfirmModal";

const AvatarSelectionPage = () => {
  const navigate = useNavigate();
  const avatars = useAiFittingStore((state) => state.avatars);
  const isLoading = useAiFittingStore((state) => state.isLoadingAvatars);
  const avatarError = useAiFittingStore((state) => state.avatarError);
  const selectedAvatarId = useAiFittingStore((state) => state.selectedAvatarId);
  const setSelectedAvatarId = useAiFittingStore((state) => state.setSelectedAvatarId);
  const loadAvatars = useAiFittingStore((state) => state.loadAvatars);
  const removeAvatar = useAiFittingStore((state) => state.removeAvatar);
  const hasLoadedAvatars = useAiFittingStore((state) => state.hasLoadedAvatars);
  const user = useUserStore((state) => state.user);
  const loadUserFromToken = useUserStore((state) => state.loadUserFromToken);
  const lastFetchedUserIdRef = useRef(null);
  const userId = user?.userId;
  const [pendingAvatarId, setPendingAvatarId] = useState(
    selectedAvatarId ?? avatars[0]?.id ?? null,
  );
  const [deletingAvatarId, setDeletingAvatarId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarToDelete, setAvatarToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      loadUserFromToken();
    }
  }, [loadUserFromToken, user]);

  useEffect(() => {
    if (!userId) return;

    if (!hasLoadedAvatars || lastFetchedUserIdRef.current !== userId) {
      lastFetchedUserIdRef.current = userId;

      loadAvatars().catch(() => {
        lastFetchedUserIdRef.current = null;
        // 에러 상태는 avatarError로 관리
      });
    }
  }, [hasLoadedAvatars, loadAvatars, userId]);

  const handleConfirm = () => {
    if (!pendingAvatarId) return;
    setSelectedAvatarId(pendingAvatarId);
    navigate("/ai-fitting");
  };

  const handleDelete = async (avatarId) => {
    if (!avatarToDelete) return;

    setDeletingAvatarId(avatarToDelete.id);

    try {
      await removeAvatar(avatarToDelete.id);
    } catch (error) {
      console.error("Failed to delete avatar", error);
      setErrorMessage("아바타 삭제 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.");
      setShowErrorModal(true);
    } finally {
      setDeletingAvatarId(null);
      setAvatarToDelete(null);
    }
  };

  const handleDeleteClick = (avatar) => {
    setAvatarToDelete(avatar);
    setShowDeleteModal(true);
  };

  // 한국어 조사 처리 함수
  const getParticle = (name) => {
    if (!name) return "를";
    const lastChar = name.charAt(name.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);

    // 한글인지 확인
    if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
      // 받침이 있는지 확인
      const hasFinalConsonant = (lastCharCode - 0xac00) % 28 !== 0;
      return hasFinalConsonant ? "을" : "를";
    }

    // 한글이 아니면 기본값
    return "를";
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>아바타를 선택하세요</h1>
      </header>

      <div className={styles.carousel}>
        {isLoading && avatars.length === 0 && (
          <div className={styles.loadingState}>아바타를 불러오는 중입니다...</div>
        )}

        {!isLoading && avatarError && avatars.length === 0 && (
          <div className={styles.errorState}>아바타를 불러오지 못했습니다.</div>
        )}

        {avatars.map((avatar) => (
          <div key={avatar.id} className={styles.avatarCardWrapper}>
            <div
              className={clsx(
                styles.avatarCard,
                pendingAvatarId === avatar.id && styles.avatarCardActive,
              )}
              onClick={() => setPendingAvatarId(avatar.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPendingAvatarId(avatar.id);
                }
              }}
            >
              <div className={styles.avatarImageWrapper}>
                <img src={avatar.imageUrl} alt={avatar.name} className={styles.avatarImage} />
                <button
                  type="button"
                  className={styles.deleteIconButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(avatar);
                  }}
                  disabled={deletingAvatarId === avatar.id}
                  aria-label="아바타 삭제"
                >
                  <img src={circleXIcon} alt="삭제" className={styles.deleteIcon} />
                </button>
              </div>
              <span className={styles.avatarName}>{avatar.name}</span>
            </div>
          </div>
        ))}

        <div className={styles.avatarCardWrapper}>
          <button
            type="button"
            className={clsx(styles.avatarCard, styles.createAvatarCard)}
            onClick={() => navigate("/ai-fitting/avatars/new")}
          >
            <div className={styles.createAvatarInner}>
              <div className={styles.createAvatarIllustration}>
                <img src={addAvatarIcon} alt="" className={styles.createIcon} />
                <span className={styles.createAvatarDescription}>
                  나만의 아바타를
                  <br />
                  제작해보세요
                </span>
                <div className={styles.createAvatarButton}>아바타 제작</div>
              </div>
              <span className={styles.createAvatarTitle}>아바타 추가</span>
            </div>
          </button>
        </div>
      </div>

      <button
        type="button"
        className={styles.confirmButton}
        onClick={handleConfirm}
        disabled={!pendingAvatarId}
      >
        선택하기
      </button>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAvatarToDelete(null);
        }}
        onConfirm={handleDelete}
        title="아바타 삭제"
        message={`정말로 '${avatarToDelete?.name}'${getParticle(avatarToDelete?.name)} 삭제하시겠습니까?`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

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
  );
};

export default AvatarSelectionPage;
