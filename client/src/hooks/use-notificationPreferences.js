import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationApi from "@/apis/notificationApi";

const KEY = ["notificationPreferences"];

// The PATCH reply is the full preferences, so it replaces the cache instead of refetching.
const useNotificationPreferences = ({ enabled = true } = {}) => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: notificationApi.getPreferences, enabled });
  const updateMutation = useMutation({
    mutationFn: notificationApi.updatePreferences,
    onSuccess: (fresh) => queryClient.setQueryData(KEY, fresh),
  });
  return { preferences: query.data, isLoading: query.isLoading, isError: query.isError, updateMutation };
};

export default useNotificationPreferences;
