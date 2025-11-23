import React, { useState } from "react";
import styles from "./ViewMode.module.css";
import { MdCalendarMonth, MdToday } from "react-icons/md";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const ViewMode = ({ viewMode, onClick: handleViewMode }) => {
  return (
    <div className={cx("viewmodeBox")}>
      <MdCalendarMonth
        className={cx("icon", { active: viewMode === "monthly" })}
        onClick={() => handleViewMode("monthly")}
      />
      <MdToday
        className={cx("icon", { active: viewMode === "daily" })}
        onClick={() => handleViewMode("daily")}
      />
    </div>
  );
};

export default ViewMode;
