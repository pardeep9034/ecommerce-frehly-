import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PartnerApi from "../apis/partnerApi";

export const usePartnerMe = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-me"],
    queryFn: () => PartnerApi.getMe(),
  });

  return { partner: data?.data || null, isLoading, error };
};

// status: "active" (today's board) or "history" (past assignments).
// date: optional "today" filter, used for the Today page's delivered/failed tiles.
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["partner-assignment"] });
    },
  });
};
