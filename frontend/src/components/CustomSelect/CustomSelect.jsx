import { useState, useEffect } from "react";
import styles from "./CustomSelect.module.css";

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "선택하세요",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(`.${styles.selectContainer}`)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getSelectedOptionName = () => {
    if (!value) return placeholder;
    const selectedOption = options.find((option) => option.codeId === value);
    return selectedOption ? selectedOption.codeName : placeholder;
  };

  return (
    <div className={`${styles.selectContainer} ${className}`}>
      <button
        type="button"
        className={`${styles.selectButton} ${!value ? styles.placeholder : ""} ${disabled ? styles.disabled : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {getSelectedOptionName()}
        <span className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>▼</span>
      </button>
      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <button
              key={option.codeId}
              type="button"
              className={styles.option}
              onClick={() => handleOptionSelect(option.codeId)}
            >
              {option.codeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
