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
export const usePartnerAssignments = (status, { date, from, to, search, page = 1, limit = 20 } = {}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-assignments", status, date, from, to, search, page, limit],
    queryFn: () => PartnerApi.getAssignments({ status, date, from, to, search, page, limit }),
  });

  return {
    assignments: data?.data?.items || [],
    total: data?.data?.total || 0,
    counts: data?.data?.counts || {},
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

// Polled: nothing else tells a partner that someone wants to hand them an order.
export const usePartnerHandovers = (dir) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-handovers", dir],
    queryFn: () => PartnerApi.getHandovers(dir),
    refetchInterval: 15000,
  });

  return { handovers: data?.data || [], isLoading, error };
};

export const useHandoverCandidates = (assignmentId) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-handover-candidates", assignmentId],
    queryFn: () => PartnerApi.getHandoverCandidates(assignmentId),
    enabled: Boolean(assignmentId),
  });

  return { candidates: data?.data || [], isLoading, error };
};

// A handover moves the order between partners, so every partner list and count is refreshed.
const refreshAfterHandover = (queryClient) =>
  Promise.all(
    ["partner-handovers", "partner-assignments", "partner-assignment", "partner-me"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  );

export const useRequestHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, ...payload }) => PartnerApi.requestHandover(assignmentId, payload),
    onSuccess: () => refreshAfterHandover(queryClient),
  });
};

// { handoverId, step }: see PartnerApi.handoverStep.
export const useHandoverStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ handoverId, step }) => PartnerApi.handoverStep(handoverId, step),
    onSuccess: () => refreshAfterHandover(queryClient),
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
