import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useClothesStore = create(
  devtools((set) => ({
    clothes: [],
    setClothes: (newClothesList) => set({ clothes: newClothesList }),
    addClothes: (newClothes) =>
      set((state) =>
        state.clothes.find((item) => item.clothesId === newClothes.clothesId)
          ? state
          : { clothes: [...state.clothes, newClothes] },
      ),
    removeClothes: (targetId) =>
      set((state) => ({
        clothes: state.clothes.filter((item) => item.clothesId !== targetId),
      })),
    updateClothes: (targetId, updatedFields) =>
      set((state) => ({
        clothes: state.clothes.map((item) =>
          item.clothesId === targetId ? { ...item, ...updatedFields } : item,
        ),
      })),
    clearClothes: () => set({ clothes: [] }),
  })),
);
