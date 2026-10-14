import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import partnerReviewApi from "@/apis/partnerReviewApi";

const QUEUE = "partnerQueue";
const detailKey = (id) => ["partnerReview", id];

export const usePartnerQueue = (params) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [QUEUE, params],
    queryFn: () => partnerReviewApi.list(params),
    placeholderData: keepPreviousData,
  });
  return { applications: data?.applications ?? [], pagination: data?.pagination, isLoading, isError };
};

// One application. `act(() => api call, { onSuccess, onError })` runs any staff write: the answer is the fresh detail, so the
// cache is replaced with it and the next decision always carries the current `version` (A7).
const usePartnerReview = (id) => {
  const queryClient = useQueryClient();
  const { data: detail, isLoading, error, refetch } = useQuery({
    queryKey: detailKey(id),
    queryFn: () => partnerReviewApi.get(id),
    retry: false,
  });

  const action = useMutation({
    mutationFn: (call) => call(),
    onSuccess: async (fresh) => {
      // A read still in flight started before this write; cancel it so its older answer cannot overwrite this one.
      await queryClient.cancelQueries({ queryKey: detailKey(id) });
      queryClient.setQueryData(detailKey(id), fresh);
      queryClient.invalidateQueries({ queryKey: [QUEUE] });
    },
    // 409: someone else got there first (A4, I4). Look at the current page again; what the reviewer typed lives in the screen and stays.
    onError: (err) => {
      if (err.response?.status === 409) queryClient.invalidateQueries({ queryKey: detailKey(id) });
    },
  });

  return { detail, isLoading, error, refetch, action };
};

export default usePartnerReview;
