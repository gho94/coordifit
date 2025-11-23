import { useState, useCallback } from "react";
import Picker from "react-mobile-picker";
import classNames from "classnames/bind";
import styles from "./DatePicker.module.css";

const cx = classNames.bind(styles);

function getDayArray(year, month) {
  const dayCount = new Date(year, month, 0).getDate();
  return Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, "0"));
}

const DatePicker = ({ onConfirm }) => {
  const today = new Date();

  const [pickerValue, setPickerValue] = useState({
    year: today.getFullYear().toString(),
    month: String(today.getMonth() + 1).padStart(2, "0"),
    day: String(today.getDate()).padStart(2, "0"),
  });

  const handlePickerChange = useCallback((newValue, key) => {
    if (key === "day") {
      setPickerValue(newValue);
      return;
    }

    const { year, month } = newValue;
    const newDayArray = getDayArray(Number(year), Number(month));
    const newDay = newDayArray.includes(newValue.day)
      ? newValue.day
      : newDayArray[newDayArray.length - 1];
    setPickerValue({ ...newValue, day: newDay });
  }, []);

  return (
    <div>
      <div className={cx("userInfoBar")}>
        {pickerValue.year} {pickerValue.month} {pickerValue.day}
      </div>
      <Picker value={pickerValue} onChange={handlePickerChange} wheelMode="natural">
        <Picker.Column name="year">
          {Array.from({ length: 100 }, (_, i) => `${1926 + i}`).map((year) => (
            <Picker.Item key={year} value={year}>
              {({ selected }) => (
                <div className={cx("pickerItem", { pickerItemSelected: selected })}>{year}</div>
              )}
            </Picker.Item>
          ))}
        </Picker.Column>

        <Picker.Column name="month">
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((month) => (
            <Picker.Item key={month} value={month}>
              {({ selected }) => (
                <div className={cx("pickerItem", { pickerItemSelected: selected })}>{month}</div>
              )}
            </Picker.Item>
          ))}
        </Picker.Column>

        <Picker.Column name="day">
          {getDayArray(Number(pickerValue.year), Number(pickerValue.month)).map((day) => (
            <Picker.Item key={day} value={day}>
              {({ selected }) => (
                <div className={cx("pickerItem", { pickerItemSelected: selected })}>{day}</div>
              )}
            </Picker.Item>
          ))}
        </Picker.Column>
      </Picker>

      <div className={cx("okButtonWrapper")}>
        <button type="button" className={cx("okButton")} onClick={() => onConfirm?.(pickerValue)}>
          OK
        </button>
      </div>
    </div>
  );
};

export default DatePicker;
