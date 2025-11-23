import { NavLink } from "react-router-dom";
import styles from "./BottomNav.module.css";

import closetIcon from "@/assets/images/closet.svg";
import calendarIcon from "@/assets/images/calendar.svg";
import homeIcon from "@/assets/images/home.svg";
import snapIcon from "@/assets/images/snap.svg";
import mypageIcon from "@/assets/images/mypage.svg";

const tabs = [
  { to: "/closet", icon: closetIcon, label: "내 옷장" },
  { to: "/calendar", icon: calendarIcon, label: "코디 캘린더" },
  { to: "/main", icon: homeIcon, label: "홈" }, // ✅ 홈은 /main
  { to: "/snap", icon: snapIcon, label: "스냅" },
  { to: "/mypage", icon: mypageIcon, label: "마이페이지" },
];

const BottomNav = () => {
  return (
    <nav className={styles.bottomNav}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.active : ""}`}
        >
          <img src={tab.icon} alt="" className={styles.icon} />
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
