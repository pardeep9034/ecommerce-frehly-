import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PartnerApi from "../apis/partnerApi";

export const usePartnerMe = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-me"],
    queryFn: () => PartnerApi.getMe(),
  });

  return { partner: data?.data || null, isLoading, error };
};

// status: "ACTIVE" (open work), "HISTORY" (anything finished) or one finished status ("COMPLETED", "FAILED", ...).
// date: optional "today" filter on finished work, used for the "delivered today" counts.
export const usePartnerAssignments = (status, { date, page = 1, limit = 20 } = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-assignments", status, date, page, limit],
    queryFn: () => PartnerApi.getAssignments({ status, date, page, limit }),
  });

  return {
    assignments: data?.data?.items || [],
    total: data?.data?.total || 0,
    isLoading,
    error,
  };
};

export const usePartnerAssignment = (assignmentId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-assignment", assignmentId],
    queryFn: () => PartnerApi.getAssignment(assignmentId),
    enabled: Boolean(assignmentId),
  });

  return { assignment: data?.data || null, isLoading, error };
};

export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, ...payload }) =>
      PartnerApi.updateAssignmentStatus(assignmentId, payload),
    // Returned, so the caller's own onSuccess (the screen's navigate) waits for fresh data: a screen opened with the old
    // step would otherwise redirect straight back. partner-me carries the active count and 7-day totals.
    onSuccess: () =>
      Promise.all(
        ["partner-assignments", "partner-assignment", "partner-me"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      ),
  });
};

// online: true | false. Resolves once partner-me has been refetched, so the switch never shows the old state.
export const useSetOnline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (online) => PartnerApi.setOnline(online),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-me"] }),
  });
};
