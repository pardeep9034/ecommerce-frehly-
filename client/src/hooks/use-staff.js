import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import staffApi from "@/apis/staffApi";
import { notify } from "@/lib/notify";

const useStaff = (page, limit, filters = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", page, limit, filters],
    queryFn: () => staffApi.getAllStaff(page, limit, filters),
    enabled: !!page && !!limit,
  });

  const createMutation = useMutation({
    mutationFn: (data) => staffApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notify.success("User created successfully");
    },
    onError: (error) => notify.apiError(error, "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => staffApi.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notify.success("User updated successfully");
    },
    onError: (error) => notify.apiError(error, "Failed to update user"),
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => staffApi.setStaffStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      notify.success("User status updated");
    },
    onError: (error) => notify.apiError(error, "Failed to update user status"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }) => staffApi.resetStaffPassword(id, data),
    onSuccess: () => notify.success("Password reset"),
    onError: (error) => notify.apiError(error, "Failed to reset password"),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id) => staffApi.resendInvite(id),
    onSuccess: () => notify.success("Login details resent"),
    onError: (error) => notify.apiError(error, "Failed to resend login details"),
  });

  return {
    staff: data?.data?.users ?? [],
    pagination: data?.data?.pagination ?? {},
    summary: data?.data?.summary ?? {},
    isLoading,
    error,
    createMutation,
    updateMutation,
    setStatusMutation,
    resetPasswordMutation,
    resendInviteMutation,
  };
};

export const useStaffDetail = (id) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff-detail", id],
    queryFn: () => staffApi.getStaffById(id),
    enabled: !!id,
  });

  return { user: data?.data ?? null, isLoading, error };
};

export default useStaff;
