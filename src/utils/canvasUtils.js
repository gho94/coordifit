import { CANVAS_CONFIG } from "@/constants/calendar";
import { CATEGORIES } from "@/constants/category";

const getCanvasPosition = (categoryCode) => {
  const centerX = CANVAS_CONFIG.WIDTH / 2;
  const centerY = CANVAS_CONFIG.HEIGHT / 2;
  const parentCategory = CATEGORIES[categoryCode].parent;

  const map = {
    B20001: { x: centerX - 20, y: centerY - 170, scale: 0.5 },
    B20002: { x: centerX - 20, y: centerY - 40, scale: 0.5 },
    B20003: { x: centerX - 20, y: centerY + 60, scale: 0.4 },
    B20004: { x: centerX - 150, y: centerY - 120, scale: 0.5 },
    B20005: { x: centerX - 150, y: centerY + 80, scale: 0.3 },
  };

  return map[parentCategory] ?? map.B20005;
};

export { getCanvasPosition };
