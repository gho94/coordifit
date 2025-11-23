import { CATEGORIES } from "@/constants/category";
import styles from "./ItemCarousel.module.css";
import cn from "classnames";

const ItemCarousel = ({ items = [], selectedId, onClick }) => {
  return (
    <div>
      <h3 className={styles.panelTitle}>사용된 아이템</h3>
      {items.length === 0 && <div className={styles.empty}>아직 없음</div>}
      <ul className={styles.usedList}>
        {items.map((clothes) => (
          <li
            key={clothes.clothesId}
            className={cn(
              styles.usedItem,
              clothes.clothesId === selectedId && styles.usedItemActive,
            )}
            onClick={() => onClick?.(clothes.clothesId)}
          >
            <img src={clothes.imageUrl} alt={clothes.name} className={styles.thumb} />
            <div className={styles.meta}>
              <div className={styles.name}>{clothes.name}</div>
              <div className={styles.category}>{CATEGORIES[clothes.categoryCode].ko}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemCarousel;
