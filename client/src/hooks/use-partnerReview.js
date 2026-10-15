import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import partnerReviewApi from "@/apis/partnerReviewApi";

const QUEUE = "partnerQueue";
const SUMMARY = "partnerSummary";
const detailKey = (id) => ["partnerReview", id];

// What is waiting for review. Feeds the stat card, the sidebar badge and the overview tile, so it is refetched now and then.
export const usePartnerSummary = ({ enabled = true } = {}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [SUMMARY],
    queryFn: () => partnerReviewApi.summary(),
    enabled,
    refetchInterval: 60_000,
  });
  return { summary: data, isLoading, isError };
};

// Staff add someone: a draft is made, the invitee is texted, and the answer is the staff detail plus `invite_sent`.
export const useCreateOnBehalf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => partnerReviewApi.createOnBehalf(body),
    onSuccess: (fresh) => {
      queryClient.setQueryData(detailKey(fresh.id), fresh);
      queryClient.invalidateQueries({ queryKey: [QUEUE] });
      queryClient.invalidateQueries({ queryKey: [SUMMARY] });
    },
  });
};

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
      queryClient.invalidateQueries({ queryKey: [SUMMARY] });
    },
    // 409: someone else got there first (A4, I4). Look at the current page again; what the reviewer typed lives in the screen and stays.
    onError: (err) => {
      if (err.response?.status === 409) queryClient.invalidateQueries({ queryKey: detailKey(id) });
    },
  });

  return { detail, isLoading, error, refetch, action };
};

export default usePartnerReview;
