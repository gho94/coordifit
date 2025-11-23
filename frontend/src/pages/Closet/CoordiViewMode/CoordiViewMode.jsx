import styles from "./CoordiViewMode.module.css";
import classNames from "classnames/bind";

import aiIcon from "@/assets/icons/samsung_ai.webp";
import { IoShirtSharp } from "react-icons/io5";

const cx = classNames.bind(styles);

const CoordiViewMode = ({ viewMode, onClickViewMode }) => {
  return (
    <div className={cx("viewModeTabs")}>
      <button
        className={cx("tabCard", { active: viewMode === "my" })}
        onClick={() => onClickViewMode("my")}
      >
        <IoShirtSharp className={cx(styles.tabIcon, { [styles.activeIcon]: viewMode === "my" })} />
        <span className={cx("tabLabel")}>내 코디</span>
      </button>

      <button
        className={cx("tabCard", { active: viewMode === "ai" })}
        onClick={() => onClickViewMode("ai")}
      >
        <img src={aiIcon} alt="AI 피팅" className={cx("tabImage")} />
        <span className={cx("tabLabel")}>AI 피팅</span>
      </button>
    </div>
  );
};

export default CoordiViewMode;
