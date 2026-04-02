import axiosInstance from './axiosInstance';

export const getUserAddresses = async (userId) => {
  const response = await axiosInstance.get(`/users/addresses/user/${userId}`);
  return response.data;
};

export const createAddress = async (data) => {
  const response = await axiosInstance.post('/users/addresses', data);
  return response.data;
};

export const updateAddress = async (id, data) => {
  const response = await axiosInstance.put(`/users/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await axiosInstance.delete(`/users/addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id, userId) => {
  const response = await axiosInstance.put(`/users/addresses/${id}/set-default`, { userId });
  return response.data;
};
