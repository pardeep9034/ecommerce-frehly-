import api from "./axiosInstance";

export const fetchCategories = async () => {
  try {
    const response = await api.get("/category");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
export const fetchAllCategories = async (searchTerm = "") => {
  try {
    const response = await api.get(`/category/selection?search=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all categories:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await api.post("/category", categoryData);
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await api.put(`/category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};      