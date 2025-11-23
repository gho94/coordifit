import clsx from "clsx";
import styles from "./Tabs.module.css";

import gridBlack from "@/assets/images/gridicon_black.png";
import gridGray from "@/assets/images/gridicon_gray.png";
import heartBlack from "@/assets/images/hearticon_black.png";
import heartGray from "@/assets/images/hearticon_gray2.png";

const Tabs = ({ tabs, activeTab, onChange }) => {
  const getIconSrc = (id) => {
    switch (id) {
      case "snap":
        return activeTab === "snap" ? gridBlack : gridGray;
      case "liked":
        return activeTab === "liked" ? heartBlack : heartGray;
      default:
        return null;
    }
  };

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <div key={tab.id} className={styles.tabWrapper}>
          <button
            type="button"
            className={clsx(styles.tab, {
              [styles.active]: tab.id === activeTab,
            })}
            onClick={() => onChange(tab.id)}
          >
            <img src={getIconSrc(tab.id)} alt={tab.label} className={styles.icon} />
          </button>

          {/* ✅ 밑줄을 버튼 아래쪽에 고정 */}
          <div
            className={clsx(styles.underline, {
              [styles.activeUnderline]: tab.id === activeTab,
            })}
          />
        </div>
      ))}
    </div>
  );
};

export default Tabs;
