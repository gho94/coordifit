import React from "react";

import classNames from "classnames/bind";

import styles from "./CalendarHeader.module.css";
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";

const cn = classNames.bind(styles);

const CalendarHeader = ({ onButtonClick, children }) => {
  return (
    <header className={cn("calendar-header")}>
      <button id="prev" className={cn("action-button")} onClick={onButtonClick}>
        <SlArrowLeft size="14" />
      </button>
      {children}
      <button id="next" className={cn("action-button")} onClick={onButtonClick}>
        <SlArrowRight size="14" />
      </button>
    </header>
  );
};

export default CalendarHeader;
