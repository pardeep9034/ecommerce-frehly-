import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import customerApi from "@/apis/customerApi";

const EMPTY = [];

// Customers come from auth-service, their order numbers from order-service.
// Two requests, merged here by user id. Order figures are null until they arrive.
const useCustomers = (page, limit, filters = {}) => {
  const listQuery = useQuery({
    queryKey: ["customers", page, limit, filters.search, filters.status, filters.joined_days, filters.id],
    queryFn: () => customerApi.getCustomers(page, limit, filters),
    placeholderData: (previousData) => previousData,
  });

  const users = listQuery.data?.data?.users ?? EMPTY;
  const userIds = useMemo(() => users.map((user) => user.id), [users]);

  const statsQuery = useQuery({
    queryKey: ["customer-stats", userIds],
    queryFn: () => customerApi.getCustomerStats(userIds),
    enabled: listQuery.isSuccess,
    placeholderData: (previousData) => previousData,
  });

  const customers = useMemo(() => {
    const statsByUser = Object.fromEntries(
      (statsQuery.data?.data?.customers ?? EMPTY).map((stats) => [stats.user_id, stats])
    );
    return users.map((user) => {
      const stats = statsByUser[user.id];
      return {
        id: user.id,
        name: user.name || user.phone,
        phone: user.phone,
        email: user.email || "No email",
        status: user.is_active ? "Active" : "Blocked",
        joined: user.joined,
        addresses: user.addresses,
        orders: stats ? stats.orders : null,
        spent: stats ? stats.spent : null,
        lastOrder: stats ? stats.last_order_at : null,
        recentOrders: stats ? stats.recent_orders : EMPTY,
      };
    });
  }, [users, statsQuery.data]);

  return {
    customers,
    pagination: listQuery.data?.data?.pagination,
    counts: listQuery.data?.data?.counts,
    summary: statsQuery.data?.data?.summary,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
  };
};

// Order count / spend for one customer (the order detail page's Customer card).
export const useCustomerStats = (userId) => {
  const query = useQuery({
    queryKey: ["customer-stats", [Number(userId)]],
    queryFn: () => customerApi.getCustomerStats([userId]),
    enabled: Boolean(userId),
  });
  return query.data?.data?.customers?.[0];
};

export const useSetCustomerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }) => customerApi.setCustomerStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export default useCustomers;
