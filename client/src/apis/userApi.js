import axiosInstance from './axiosInstance';

export const getUserAddresses = async (userId) => {
  const response = await axiosInstance.get(`/user-addresses`);
  return response.data.data;
};

export const createAddress = async (data) => {
  console.log("Creating address with data:", data);
  const response = await axiosInstance.post('/user-addresses', data);
  return response.data.data;
};

export const updateAddress = async (id, data) => {
  console.log("Updating address with data:", data);
  const response = await axiosInstance.put(`/user-addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id) => {
  const response = await axiosInstance.delete(`/user-addresses/${id}`);
  return response.data.data;
};

export const setDefaultAddress = async (id, userId) => {
  const response = await axiosInstance.put(`/user-addresses/${id}/set-default`, { userId });
  return response.data.data;
};
