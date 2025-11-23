import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "../../stores/userStore";
import Modal from "../../components/Modal/Modal";
import { requestLogin, getKakaoLoginUrl, requestKakaoLogin } from "../../services/authService";
import userService from "@/services/userService";
import { KAKAO_REDIRECT_URI } from "@/config/config";

import kakaobutton from "@/assets/images/kakaobutton.png";
import styles from "./LoginPage.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loadUserFromToken } = useUserStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActivateModalOpen, setActivateModalOpen] = useState(false);
  const [deactivatedUserId, setDeactivatedUserId] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 에러 메시지 초기화
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 입력값 검증
    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!formData.password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // ✅ 서비스 모듈 호출로 교체
      const response = await requestLogin(formData);

      if (response.success) {
        console.log(response.data);

        // 메인 페이지로 이동
        navigate("/main");
      } else {
        setError(response.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 오류:", error);

      // 비활성화된 계정인 경우
      if (error.response?.status === 403 && !error.response?.data?.data?.isActive) {
        setDeactivatedUserId(error.response.data.data.userId);
        setActivateModalOpen(true);
        setError("");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateAccount = async () => {
    try {
      setIsLoading(true);
      // ✅ 서비스 모듈 호출로 교체
      const response = await userService.activateAccount(deactivatedUserId);
      if (response.success) {
        // 모달 닫기
        setActivateModalOpen(false);

        // 메인 페이지로 이동
        navigate("/main");
      }
    } catch (error) {
      console.error("계정 활성화 오류:", error);
      setError("계정 활성화 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseActivateModal = () => {
    setActivateModalOpen(false);
    setDeactivatedUserId("");
  };

  useEffect(() => {
    const handleKakaoCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (!code && !errorParam) return;

      setIsLoading(true);
      setError("");

      if (errorParam) {
        console.error("카카오 로그인 오류:", errorParam);
        setError("카카오 로그인이 취소되었습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await requestKakaoLogin(code, KAKAO_REDIRECT_URI);

        if (response.success) {
          console.log("카카오 로그인 성공:", response.data);
          navigate("/main");
        } else {
          setError(response.message || "카카오 로그인에 실패했습니다.");
        }
      } catch (error) {
        console.error("카카오 로그인 처리 중 오류:", error);

        if (error.response?.status === 403 && !error.response?.data?.data?.isActive) {
          setDeactivatedUserId(error.response.data.data.userId);
          setActivateModalOpen(true);
          setError("");
        } else {
          setError(error.response?.data?.message || "카카오 로그인 처리 중 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, navigate]);

  const handleKakaoLogin = () => {
    const kakaoLoginUrl = getKakaoLoginUrl();
    window.location.href = kakaoLoginUrl;
  };

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.logo}>CoordiFit</h1>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <label className={styles.label} htmlFor="email">
          이메일 주소
        </label>
        <input
          id="email"
          name="email"
          className={styles.input}
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="예) coordifit@codifit.com"
          disabled={isLoading}
        />
        <label className={styles.label} htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          className={styles.input}
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="비밀번호"
          disabled={isLoading}
        />
        <button type="submit" className={styles.loginButton} disabled={isLoading}>
          {isLoading ? "로그인 중..." : "로그인"}
        </button>

        <div className={styles.links}>
          <button type="button" className={styles.linkButton} onClick={() => navigate("/signup")}>
            이메일 회원가입
          </button>
          <div className={styles.line}></div>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => navigate("/password-reset")}
          >
            비밀번호 찾기
          </button>
        </div>

        <button type="button" className={styles.kakaoButton} onClick={handleKakaoLogin}>
          <img src={kakaobutton} alt="카카오로 시작하기" />
        </button>
      </form>

      {isActivateModalOpen && (
        <Modal
          title="계정 활성화"
          onClose={handleCloseActivateModal}
          footer={
            <>
              <button type="button" onClick={handleCloseActivateModal}>
                취소
              </button>
              <button type="button" onClick={handleActivateAccount} disabled={isLoading}>
                {isLoading ? "활성화 중..." : "활성화하기"}
              </button>
            </>
          }
        >
          <p>비활성화된 계정입니다. 계정을 다시 활성화하시겠습니까?</p>
        </Modal>
      )}
    </div>
  );
};

export default Login;
