import styles from "./Button.module.css";
import cn from "classnames";

const Button = ({
  children,
  style = "default",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      className={cn(styles.button, styles[style], styles[size], disabled && styles.disabled)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
export default Button;
