import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useCoordiStore = create(
  devtools((set) => ({
    coordiItems: [],
    setCoordiItems: (newCoordiItems) => set({ coordiItems: newCoordiItems }),
    addCoordiItem: (newItem) =>
      set((state) =>
        state.coordiItems.find((item) => item.clothesId === newItem.clothesId)
          ? state
          : { coordiItems: [...state.coordiItems, newItem] },
      ),
    removeCooridItem: (targetId) =>
      set((state) => ({
        coordiItems: state.coordiItems.filter((coordiItem) => coordiItem.clothesId !== targetId),
      })),
    updateCoordiItem: (targetId, updatedFileds) =>
      set((state) => ({
        coordiItems: state.coordiItems.map((coordiItem) =>
          coordiItem.clothesId === targetId ? { ...coordiItem, ...updatedFileds } : coordiItem,
        ),
      })),
    clearCoordiItems: () => set({ coordiItems: [] }),
  })),
);
