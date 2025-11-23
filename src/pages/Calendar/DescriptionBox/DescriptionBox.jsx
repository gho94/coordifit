import { FiEdit3 } from "react-icons/fi";
import cx from "classnames";
import styles from "./DescriptionBox.module.css";

const DescriptionBox = ({ description }) => {
  return (
    <div className={cx(styles.descriptionBox)}>
      {description ? (
        <p className={cx(styles.descriptionText)}>{description}</p>
      ) : (
        <div className={cx(styles.placeholderBox)}>
          <FiEdit3 className={cx(styles.placeholderIcon)} />
          <span className={cx(styles.placeholderText)}>설명이 아직 등록되지 않았어요</span>
        </div>
      )}
    </div>
  );
};

export default DescriptionBox;
