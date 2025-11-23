import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PasswordResetPage.module.css";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";

// ✅ 서비스 함수만 import
import { checkEmailDuplicate, sendPasswordResetCode, resetPassword } from "@/services/authService";

const PasswordReset = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    verificationCode: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  const [validation, setValidation] = useState({
    email: false,
    emailVerified: false,
    password: false,
    passwordConfirm: false,
  });

  const [emailChecked, setEmailChecked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [sentVerificationCode, setSentVerificationCode] = useState("");
  const [messages, setMessages] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailCheckTimeoutRef = useRef(null);

  /* ✅ 유효성 검사 함수 */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (pw) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#^]).{8,}$/.test(pw);

  /* ✅ 입력 실시간 검증 */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "email") {
      const isValid = validateEmail(value);
      setValidation((p) => ({ ...p, email: isValid }));
      setMessages((p) => ({
        ...p,
        email: isValid ? "이메일 중복 확인이 필요합니다." : "올바른 이메일 형식을 입력해주세요.",
      }));
      // 이메일이 변경되면 중복 확인 상태 초기화
      setEmailChecked(false);

      // 기존 타이머 클리어
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }

      // 1초 후 자동으로 중복 확인 실행 (유효한 이메일일 경우)
      if (isValid) {
        emailCheckTimeoutRef.current = setTimeout(async () => {
          try {
            const result = await checkEmailDuplicate(value);
            // 비밀번호 재설정은 이메일이 존재해야 함 (회원가입과 반대)
            if (result.success && !result.data) {
              // 이메일이 이미 사용 중 = 존재함 = OK
              setMessages((p) => ({ ...p, email: "사용 가능한 이메일입니다." }));
              setValidation((p) => ({ ...p, email: true }));
              setEmailChecked(true);
            } else {
              // 이메일이 사용 가능 = 존재하지 않음 = 에러
              setMessages((p) => ({ ...p, email: "존재하지 않는 이메일입니다." }));
              setValidation((p) => ({ ...p, email: false }));
              setEmailChecked(false);
            }
          } catch {
            setMessages((p) => ({ ...p, email: "이메일 중복 확인 중 오류가 발생했습니다." }));
            setValidation((p) => ({ ...p, email: false }));
            setEmailChecked(false);
          }
        }, 1000);
      }
    } else if (field === "newPassword") {
      const isValid = validatePassword(value);
      setValidation((p) => ({ ...p, password: isValid }));
      setMessages((p) => ({
        ...p,
        password: isValid
          ? "사용 가능한 비밀번호입니다."
          : "영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.",
      }));

      if (formData.newPasswordConfirm) {
        const match = value === formData.newPasswordConfirm;
        setValidation((p) => ({ ...p, passwordConfirm: match }));
        setMessages((p) => ({
          ...p,
          passwordConfirm: match ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.",
        }));
      }
    } else if (field === "newPasswordConfirm") {
      const match = value === formData.newPassword;
      setValidation((p) => ({ ...p, passwordConfirm: match }));
      setMessages((p) => ({
        ...p,
        passwordConfirm: match ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다.",
      }));
    } else if (field === "verificationCode") {
      const isValid = value.length === 6;
      setValidation((p) => ({ ...p, emailVerified: isValid }));
      setMessages((p) => ({
        ...p,
        verification: isValid ? "인증 코드가 입력되었습니다." : "6자리 인증 코드를 입력해주세요.",
      }));
    }
  };

  /* ✅ 이메일 중복 확인 */
  const handleEmailCheck = async () => {
    if (!validation.email) return;
    try {
      const result = await checkEmailDuplicate(formData.email);
      // 비밀번호 재설정은 이메일이 존재해야 함 (회원가입과 반대)
      if (result.success && !result.data) {
        // 이메일이 이미 사용 중 = 존재함 = OK
        setMessages((p) => ({ ...p, email: "사용 가능한 이메일입니다." }));
        setValidation((p) => ({ ...p, email: true }));
        setEmailChecked(true);
      } else {
        // 이메일이 사용 가능 = 존재하지 않음 = 에러
        setMessages((p) => ({ ...p, email: "존재하지 않는 이메일입니다." }));
        setValidation((p) => ({ ...p, email: false }));
        setEmailChecked(false);
      }
    } catch {
      setMessages((p) => ({ ...p, email: "이메일 중복 확인 중 오류가 발생했습니다." }));
      setValidation((p) => ({ ...p, email: false }));
      setEmailChecked(false);
    }
  };

  /* ✅ 이메일 인증 코드 발송 */
  const handleSendVerification = async () => {
    if (!validation.email) {
      setErrorMessage("유효한 이메일을 먼저 입력해주세요.");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    try {
      const result = await sendPasswordResetCode(formData.email);
      if (result.success) {
        setSentVerificationCode(result.data);
        setVerificationTimer(600);
        setErrorMessage("인증 코드가 발송되었습니다.");
        setShowSuccessModal(true);
      } else {
        setErrorMessage(result.message);
        setShowErrorModal(true);
      }
    } catch {
      setErrorMessage("인증 코드 발송 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  /* ✅ 인증번호 확인 */
  const handleVerifyCode = () => {
    if (formData.verificationCode === sentVerificationCode) {
      setValidation((p) => ({ ...p, emailVerified: true }));
      setMessages((p) => ({ ...p, verification: "이메일 인증이 완료되었습니다." }));
      setVerificationTimer(0);
    } else {
      setValidation((p) => ({ ...p, emailVerified: false }));
      setMessages((p) => ({ ...p, verification: "인증 코드가 올바르지 않습니다." }));
    }
  };

  /* ✅ 인증 타이머 */
  useEffect(() => {
    let timer = null;
    if (verificationTimer > 0) {
      timer = setInterval(() => setVerificationTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [verificationTimer]);

  /* ✅ 비밀번호 재설정 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(validation).every(Boolean)) {
      setErrorMessage("모든 필수 항목을 확인해주세요.");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetPassword(
        formData.email,
        formData.verificationCode,
        formData.newPassword,
      );
      if (result.success) {
        setErrorMessage("비밀번호가 성공적으로 재설정되었습니다!");
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMessage(result.message || "비밀번호 재설정에 실패했습니다.");
        setShowErrorModal(true);
      }
    } catch {
      setErrorMessage("비밀번호 재설정 중 오류가 발생했습니다.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* 이메일 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>이메일 주소</label>
          <div className={styles.row}>
            <input
              className={styles.input}
              type="email"
              placeholder="예) coordifit@codifit.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            <button
              type="button"
              className={styles.smallButton}
              onClick={handleSendVerification}
              disabled={!emailChecked || isLoading}
            >
              {isLoading ? "발송 중..." : "인증받기"}
            </button>
          </div>
          {messages.email && (
            <div
              className={`${styles.validationMessage} ${
                validation.email ? styles.success : styles.error
              }`}
            >
              {messages.email}
            </div>
          )}
        </div>

        {/* 인증번호 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>인증번호</label>
          <div className={styles.row}>
            <input
              className={styles.input}
              type="text"
              placeholder="6자리 인증 코드"
              maxLength={6}
              value={formData.verificationCode}
              onChange={(e) => handleInputChange("verificationCode", e.target.value)}
            />
            <button
              type="button"
              className={styles.smallButton}
              onClick={handleVerifyCode}
              disabled={!formData.verificationCode}
            >
              인증하기
            </button>
          </div>
          {messages.verification && (
            <div
              className={`${styles.validationMessage} ${
                validation.emailVerified ? styles.success : styles.error
              }`}
            >
              {messages.verification}
            </div>
          )}
          {verificationTimer > 0 && (
            <div className={styles.timer}>
              {Math.floor(verificationTimer / 60)}:
              {(verificationTimer % 60).toString().padStart(2, "0")} 남음
            </div>
          )}
        </div>

        {/* 새 비밀번호 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>새 비밀번호</label>
          <input
            className={styles.input}
            type="password"
            value={formData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
          />
          {messages.password && (
            <div
              className={`${styles.validationMessage} ${
                validation.password ? styles.success : styles.error
              }`}
            >
              {messages.password}
            </div>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>새 비밀번호 확인</label>
          <input
            className={styles.input}
            type="password"
            value={formData.newPasswordConfirm}
            onChange={(e) => handleInputChange("newPasswordConfirm", e.target.value)}
          />
          {messages.passwordConfirm && (
            <div
              className={`${styles.validationMessage} ${
                validation.passwordConfirm ? styles.success : styles.error
              }`}
            >
              {messages.passwordConfirm}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!Object.values(validation).every(Boolean) || isLoading}
        >
          {isLoading ? "처리 중..." : "비밀번호 재설정"}
        </button>
      </form>

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
    </div>
  );
};

export default PasswordReset;
