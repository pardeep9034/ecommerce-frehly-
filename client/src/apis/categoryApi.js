import api from "./axiosInstance";

export const fetchCategories = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/products/category?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await api.post("/products/category", categoryData);
    return response.data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await api.put(`/products/category/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/products/category/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};      