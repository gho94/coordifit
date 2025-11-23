import { create } from "zustand";

export const useSnapStore = create((set) => ({
  imageFiles: [],
  uploadedImages: [],
  selectedItems: [],
  deletedFileIds: [],
  editPostData: null,

  setImageFiles: (files) => set({ imageFiles: files }),
  setUploadedImages: (images) => set({ uploadedImages: images }),
  setSelectedItems: (items) => set({ selectedItems: items }),
  setDeletedFileIds: (ids) => set({ deletedFileIds: ids }),
  setEditPostData: (data) => set({ editPostData: data }),

  clearSnapData: () =>
    set({
      imageFiles: [],
      uploadedImages: [],
      selectedItems: [],
      deletedFileIds: [],
      editPostData: null,
    }),
}));
