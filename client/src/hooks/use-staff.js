import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import staffApi from "@/apis/staffApi";
import warehouseApi from "@/apis/warehouseApi";
import { notify } from "@/lib/notify";
import { DEMO_STAFF, isApiMissing, retryUnlessMissing } from "@/lib/demoData";
import { fullName, needsAttention, staffStatus } from "@/lib/staffRole";

const summarize = (users) => {
  const admins = users.filter((user) => user.role === "ADMIN");
  const ops = users.filter((user) => user.role === "OPS_STAFF");
  return {
    total: users.length,
    super_admin: users.filter((user) => user.role === "SUPER_ADMIN").length,
    admin: admins.length,
    admin_unassigned: admins.filter((user) => !user.warehouse_id).length,
    ops_staff: ops.length,
    on_shift: ops.filter((user) => user.on_shift).length,
    locked: users.filter((user) => staffStatus(user) === "LOCKED").length,
    first_login_pending: users.filter((user) => ["MUST_CHANGE_PASSWORD", "INVITE_SENT"].includes(staffStatus(user))).length,
    attention: users.filter(needsAttention).length,
  };
};

const matchesFilters = (user, { role, search, warehouse_id, status }) => {
  if (role && user.role !== role) return false;
  if (warehouse_id === "none" && user.warehouse_id) return false;
  if (warehouse_id && warehouse_id !== "none" && String(user.warehouse_id) !== String(warehouse_id)) return false;
  if (status && staffStatus(user) !== status) return false;
  const term = search?.trim().toLowerCase();
  if (term && !`${fullName(user)} ${user.phone || ""} ${user.email || ""}`.toLowerCase().includes(term)) return false;
  return true;
};

// Lists admins and ops staff. Until GET /auth/admin/users exists this returns the
// design's demo users (`isDemo: true`), pinned onto the real warehouses.
const useStaff = (page, limit, filters = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", page, limit, filters],
    queryFn: () => staffApi.getAllStaff(page, limit, filters),
    enabled: !!page && !!limit,
    retry: retryUnlessMissing,
  });
  const isDemo = isApiMissing(error);

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses", 1, 100],
    queryFn: () => warehouseApi.getAllWarehouses(1, 100),
    enabled: isDemo,
  });

  const demo = useMemo(() => {
    if (!isDemo) return null;
    const warehouses = warehousesData?.data?.warehouses ?? [];
    const users = DEMO_STAFF.map((user) => {
      const warehouse = user.warehouse_slot === null ? null : warehouses[user.warehouse_slot];
      return { ...user, warehouse_id: warehouse?.id ?? null, warehouse_name: warehouse?.name ?? null };
    });
    return { users, summary: summarize(users) };
  }, [isDemo, warehousesData]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] });

  const createMutation = useMutation({
    mutationFn: (payload) => staffApi.createStaff(payload),
    onSuccess: invalidate,
    // A missing endpoint is handled by the page (it shows an unsaved preview).
    onError: (err) => !isApiMissing(err) && notify.apiError(err, "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }) => staffApi.updateStaff(id, payload),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["staff-detail"] });
      notify.success("User updated");
    },
    onError: (err) => notify.apiError(err, "Failed to update user"),
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => staffApi.setStaffStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      invalidate();
      notify.success(isActive ? "Account enabled" : "Account disabled");
    },
    onError: (err) => notify.apiError(err, "Failed to update account status"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data: payload }) => staffApi.resetStaffPassword(id, payload),
    onSuccess: invalidate,
    onError: (err) => notify.apiError(err, "Failed to reset password"),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (id) => staffApi.resendInvite(id),
    onSuccess: invalidate,
    onError: (err) => notify.apiError(err, "Failed to resend login details"),
  });

  const users = demo ? demo.users : data?.data?.users ?? [];

  return {
    staff: demo ? demo.users.filter((user) => matchesFilters(user, filters)) : users,
    allStaff: users,
    pagination: demo ? {} : data?.data?.pagination ?? {},
    summary: demo ? demo.summary : { ...summarize(users), ...data?.data?.summary },
    isDemo,
    isLoading,
    error: isDemo ? null : error,
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
    retry: retryUnlessMissing,
  });

  return { user: data?.data ?? null, isLoading, error, isDemo: isApiMissing(error) };
};

export default useStaff;
