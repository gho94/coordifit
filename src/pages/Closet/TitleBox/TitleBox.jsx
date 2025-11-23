import React from "react";
import { FiEdit3 } from "react-icons/fi";
import styles from "./TitleBox.module.css";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const TitleBox = ({ title }) => {
  return (
    <div className={cx("titleBox")}>
      {title ? (
        <h2 className={cx("titleText")}>{title}</h2>
      ) : (
        <div className={cx("placeholderBox")}>
          <FiEdit3 className={cx("placeholderIcon")} />
          <span className={cx("placeholderText")}>제목이 아직 등록되지 않았어요</span>
        </div>
      )}
    </div>
  );
};

export default TitleBox;
