// components/Layout/Header/Header.jsx
import { useMatches, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import backIcon from "../../../assets/images/chevron-left.svg";

const Header = () => {
  const matches = useMatches();
  const navigate = useNavigate();

  const active = matches[matches.length - 1];
  const handle = active?.handle ?? {};

  const title =
    typeof handle.title === "function" ? handle.title(active.params, active) : (handle.title ?? "");

  const showBack = handle.showBack ?? true;

  const onBack = () => {
    const currentPath = window.location.pathname;

    if (currentPath.startsWith("/closet/coordi")) {
      navigate("/closet", { state: { isCoordiTab: true } });
      return;
    }

    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate("/main");
  };

  return (
    <header id="app-header" className={styles.header}>
      {showBack ? (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="이전으로">
          <img src={backIcon} alt="" className={styles.backIcon} />
        </button>
      ) : (
        <div className={styles.placeholder} />
      )}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.placeholder} />
    </header>
  );
};

export default Header;
