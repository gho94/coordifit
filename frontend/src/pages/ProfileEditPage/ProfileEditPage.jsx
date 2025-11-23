import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal/Modal";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { useUserStore } from "@/stores/userStore";
import { TokenManager } from "@/services/axiosInstance";
import userService from "@/services/userService";
import commonCodeService from "@/services/commonCodeService";
import profileImage from "@/assets/images/profile.png";
import chevronRight from "@/assets/images/chevron-right.png";
import styles from "./ProfileEditPage.module.css";
import { createPortal } from "react-dom";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const [form, setForm] = useState({
    userId: "",
    nickname: "",
    email: "",
    gender: "",
    birth: "",
  });
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [genderOptions, setGenderOptions] = useState([]);
  const [file, setFile] = useState(null);
  const [fileImage, setFileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(null);
  const [isGenderModalOpen, setGenderModalOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadGenderCodes = async () => {
    const response = await commonCodeService.getCommonCodesByParentCodeId("A10002");
    if (response.success && response.data) {
      setGenderOptions(response.data);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      const profileData = {
        nickname: form.nickname,
        genderCode: form.gender,
        birthDate: form.birth ? form.birth : null,
        file: file,
      };

      console.log("프로필 업데이트 데이터:", profileData);

      const response = await userService.updateUserProfile(user.userId, profileData);

      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        TokenManager.setTokens(accessToken, refreshToken);
      }

      setErrorMessage("프로필이 성공적으로 수정되었습니다.");
      setShowSuccessModal(true);
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      setErrorMessage("프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setShowErrorModal(true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    try {
      await userService.logout(user.userId);
    } catch (error) {
      console.error("로그아웃 서버 요청 실패:", error);
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteModalOpen(false);
    try {
      await userService.deactivateAccount(user.userId);
      logout();
      navigate("/login");
    } catch (error) {
      console.error("계정 비활성화 실패:", error);
      setErrorMessage("계정 비활성화 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    }
  };

  useEffect(() => {
    loadGenderCodes();
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        userId: user.userId || "",
        nickname: user.nickname || "",
        email: user.email || "",
        gender: user.genderCode || "",
        birth: user.birthDate ? user.birthDate.split("T")[0] : "",
      });

      setFileImage(user.profileImageUrl || null);
    }
  }, [user]);

  return (
    <form className={styles.page} onSubmit={handleSave}>
      {/* ✅ 상단 저장 버튼 (header portal) */}
      {document.querySelector("#app-header") &&
        createPortal(
          <button type="button" className={styles.saveButton} onClick={handleSave}>
            저장
          </button>,
          document.querySelector("#app-header"),
        )}

      {/* ✅ 프로필 이미지 */}
      <div className={styles.avatarContainer}>
        <div className={styles.avatar}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          <img
            src={fileImage || profileImage}
            alt="프로필 미리보기"
            onClick={() => fileInputRef.current?.click()}
            className={styles.avatarImage}
          />
        </div>
        <span className={styles.avatarChangeText} onClick={() => fileInputRef.current?.click()}>
          사진 변경
        </span>
      </div>

      {/* ✅ 프로필 정보 필드 */}
      <div className={styles.fields}>
        {/* 닉네임 */}
        <div className={`${styles.field} ${isEditing === "nickname" ? styles.editing : ""}`}>
          <span className={styles.fieldLabel}>닉네임</span>
          {isEditing === "nickname" ? (
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              onBlur={() => setIsEditing(null)}
              autoFocus
              className={styles.fieldValue}
            />
          ) : (
            <span className={styles.fieldValue}>{form.nickname || "입력"}</span>
          )}
          <img
            src={chevronRight}
            alt=">"
            className={styles.fieldChevron}
            onClick={() => setIsEditing("nickname")}
          />
        </div>

        {/* 이메일 */}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>이메일</span>
          <span className={styles.fieldValue}>{form.email}</span>
        </div>

        {/* 성별 */}
        <div className={`${styles.field} ${isEditing === "gender" ? styles.editing : ""}`}>
          <span className={styles.fieldLabel}>성별</span>
          <span className={styles.fieldValue} onClick={() => setGenderModalOpen(true)}>
            {genderOptions.find((opt) => opt.codeId === form.gender)?.codeName || "선택"}
          </span>
          <img
            src={chevronRight}
            alt=">"
            className={styles.fieldChevron}
            onClick={() => setGenderModalOpen(true)}
          />
        </div>

        {/* 생년월일 */}
        <div className={`${styles.field} ${isEditing === "birth" ? styles.editing : ""}`}>
          <span className={styles.fieldLabel}>생년월일</span>
          {isEditing === "birth" ? (
            <input
              type="date"
              value={form.birth}
              onChange={(e) => setForm({ ...form, birth: e.target.value })}
              onBlur={() => setIsEditing(null)}
              autoFocus
              className={styles.fieldValue}
            />
          ) : (
            <span className={styles.fieldValue}>{form.birth || "추가"}</span>
          )}
          <img
            src={chevronRight}
            alt=">"
            className={styles.fieldChevron}
            onClick={() => setIsEditing("birth")}
          />
        </div>
      </div>

      {/* ✅ 로그아웃 / 탈퇴 */}
      <div className={styles.actions}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => setDeleteModalOpen(true)}
        >
          계정을 탈퇴하시겠습니까?
        </button>
      </div>

      {/* ✅ 성별 선택 모달 */}
      {isGenderModalOpen && (
        <Modal title="성별 선택" onClose={() => setGenderModalOpen(false)}>
          <div className={styles.genderOptions}>
            {genderOptions.map((option) => (
              <button
                key={option.codeId}
                type="button"
                className={`${styles.genderButton} ${
                  form.gender === option.codeId ? styles.selected : ""
                }`}
                onClick={() => {
                  setForm({ ...form, gender: option.codeId });
                  setGenderModalOpen(false); // 선택 후 닫기
                }}
              >
                {option.codeName}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ✅ 탈퇴 확인 모달 */}
      {isDeleteModalOpen && (
        <Modal
          title="계정을 탈퇴하시겠습니까?"
          onClose={() => setDeleteModalOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setDeleteModalOpen(false)}>
                취소
              </button>
              <button type="button" onClick={handleDeleteAccount}>
                탈퇴하기
              </button>
            </>
          }
        >
          <p className={styles["modal-message"]}>
            탈퇴를 진행하면 지금까지 저장된 코디 기록이 모두 삭제돼요.
          </p>
        </Modal>
      )}

      {/* 오류 모달 */}
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

      {/* 성공 모달 */}
      <ConfirmModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title="성공"
        message={errorMessage}
        confirmText="확인"
        cancelText=""
        variant="default"
      />
    </form>
  );
};

export default ProfileEditPage;
