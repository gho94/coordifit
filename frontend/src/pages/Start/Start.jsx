import { useNavigate } from "react-router-dom";

import styles from "./Start.module.css";

const Start = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.logo}>CoordiFit</h1>
                <p className={styles.subtitle}>오늘의 스타일을 관리해 보세요</p>
                <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => navigate("/login")}
                >
                    로그인
                </button>
                <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => navigate("/signup")}
                >
                    이메일 회원가입
                </button>
            </div>
        </div>
    );
};

export default Start;
