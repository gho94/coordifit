import React, { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import CalendarDetail from "../CalendarDetail/CalendarDetail";
import CalendarMonthly from "../CalendarMonthly/CalendarMonthly";

const CalendarBody = () => {
  const { date } = useParams();

  const isMonthly = /^\d{4}-\d{2}$/.test(date);
  const isDaily = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const { targetDate, setTargetDate, handleClickDay, setViewMode } = useOutletContext();

  return (
    <>
      {isMonthly && (
        <CalendarMonthly
          targetDate={targetDate}
          date={date}
          setTargetDate={setTargetDate}
          setViewMode={setViewMode}
          handleClickDay={handleClickDay}
        />
      )}
      {isDaily && <CalendarDetail />}
    </>
  );
};

export default CalendarBody;
