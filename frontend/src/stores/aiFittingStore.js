import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  fetchAvatars,
  createAvatar as createAvatarService,
  deleteAvatar,
} from "@/services/avatars.js";

/**
 * 백엔드 응답 → 프론트에서 쓰기 편한 구조로 변환
 */
const normalizeAvatar = (avatar) => ({
  id: avatar.avatarId || avatar.id,
  name: avatar.avatarName || avatar.name,
  imageUrl: avatar.fileUrl || avatar.imageUrl, // ✅ 중복 제거
});

const extractAvatarList = (response) => {
  let list = [];

  if (Array.isArray(response)) list = response;
  else if (Array.isArray(response?.data)) list = response.data;
  else if (Array.isArray(response?.data?.data)) list = response.data.data;
  else if (Array.isArray(response?.data?.avatars)) list = response.data.avatars;

  return list.map(normalizeAvatar);
};

const extractAvatar = (response) => {
  let raw = response?.data?.data || response?.data?.avatar || response?.data || response;
  if (!raw) return null;
  return normalizeAvatar(raw);
};

const createEmptySelection = () => ({
  top: null,
  bottom: null,
  shoes: null,
});

export const useAiFittingStore = create(
  devtools(
    (set) => ({
      avatars: [],
      selectedAvatarId: null,
      isLoadingAvatars: false,
      avatarError: null,
      hasLoadedAvatars: false,
      clothingSelection: createEmptySelection(),
      targetCoordiId: null,
      setTargetCoordiId: (id) => set({ targetCoordiId: id }),
      resetTargetCoordiId: () => set({ targetCoordiId: null }),
      setSelectedAvatarId: (avatarId) => set({ selectedAvatarId: avatarId }),

      // 아바타 목록 불러오기
      loadAvatars: async () => {
        set({ isLoadingAvatars: true, avatarError: null });
        try {
          const response = await fetchAvatars();
          console.log("📥 fetchAvatars raw response:", response);

          const avatars = extractAvatarList(response);
          console.log("✅ parsed avatars:", avatars);

          set((state) => {
            const selectedAvatarExists = avatars.some(
              (avatar) => avatar.id === state.selectedAvatarId,
            );
            return {
              avatars,
              selectedAvatarId: selectedAvatarExists ? state.selectedAvatarId : null,
              isLoadingAvatars: false,
              avatarError: null,
              hasLoadedAvatars: true,
            };
          });

          return avatars;
        } catch (error) {
          set({
            isLoadingAvatars: false,
            avatarError: error,
            hasLoadedAvatars: true,
          });
          throw error;
        }
      },

      // 아바타 생성
      createAvatar: async (payload) => {
        try {
          const response = await createAvatarService(payload);
          const newAvatar = extractAvatar(response);

          if (!newAvatar) return null;

          set((state) => ({
            avatars: [...state.avatars, newAvatar],
            selectedAvatarId: newAvatar.id ?? state.selectedAvatarId,
            avatarError: null,
            hasLoadedAvatars: true,
          }));

          return newAvatar;
        } catch (error) {
          set({ avatarError: error });
          throw error;
        }
      },

      // 아바타 삭제
      removeAvatar: async (avatarId) => {
        try {
          await deleteAvatar(avatarId);
          set((state) => {
            const avatars = state.avatars.filter((avatar) => avatar.id !== avatarId);
            const selectedAvatarExists = avatars.some(
              (avatar) => avatar.id === state.selectedAvatarId,
            );
            return {
              avatars,
              selectedAvatarId: selectedAvatarExists ? state.selectedAvatarId : null,
              avatarError: null,
            };
          });
        } catch (error) {
          set({ avatarError: error });
          throw error;
        }
      },

      // 착용 아이템 선택
      updateClothingSelection: (type, item) =>
        set((state) => ({
          clothingSelection: {
            ...state.clothingSelection,
            [type]: item,
          },
        })),

      // AI 피팅 전체 상태 초기화 (아바타 선택 + 옷 선택 모두 초기화)
      resetAiFittingState: () =>
        set({
          selectedAvatarId: null,
          clothingSelection: createEmptySelection(),
        }),
    }),
    { name: "AiFittingStore" },
  ),
);
