import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PartnerApi from "../apis/partnerApi";
import { HANDOVER_LABEL, jobNote, jobPath } from "@/lib/assignmentStatus";
import { notify } from "@/lib/notify";

const SLOW_SAVE_MS = 20000;
const RECHECK_MS = 5000;

// A rider action on one job. `run(action)` calls the mutateAsync and resolves true once it is saved. While it runs,
// `phase` is "saving", then "checking" after 20 s, when the job is re-read every 5 s. A 409 re-reads it at once.
// If the job is already finished or on another step (a slow save that went through, a refresh, a second tap), the
// rider gets a short note and is taken where the job is. If it hasn't moved, the 409 was a real refusal: its error
// shows. run resolves false in both cases.
export const useJobAction = (assignment) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState("idle");
  const before = useRef(null);
  const moved = useRef(false);

  const recheck = async () => {
    const response = await PartnerApi.getAssignment(assignment.id);
    const fresh = response.data;
    const { assignment_status, status } = before.current;
    if (fresh.assignment_status === assignment_status && fresh.status === status) return false;
    moved.current = true;
    queryClient.setQueryData(["partner-assignment", assignment.id], response);
    ["partner-assignments", "partner-me"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    notify.info(jobNote(fresh));
    navigate(jobPath(fresh), { replace: true });
    return true;
  };

  useEffect(() => {
    if (phase !== "checking") return undefined;
    const timer = setInterval(() => recheck().catch(() => {}), RECHECK_MS);
    return () => clearInterval(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action) => {
    before.current = { assignment_status: assignment.assignment_status, status: assignment.status };
    moved.current = false;
    setPhase("saving");
    const slow = setTimeout(() => setPhase("checking"), SLOW_SAVE_MS);
    try {
      await action();
      return !moved.current;
    } catch (error) {
      if (moved.current) return false;
      if (error.response?.status === 409 && (await recheck().catch(() => false))) return false;
      notify.apiError(error);
      return false;
    } finally {
      clearTimeout(slow);
      setPhase("idle");
    }
  };

  return { run, phase, busy: phase !== "idle" };
};

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

// `refetchInterval` (ms): Pickup polls so the screen moves on once the store hands the order over.
export const usePartnerAssignment = (assignmentId, refetchInterval) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-assignment", assignmentId],
    queryFn: () => PartnerApi.getAssignment(assignmentId),
    enabled: Boolean(assignmentId),
    refetchInterval,
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

export const useFinishPickup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, collected }) => PartnerApi.finishPickup(assignmentId, collected),
    onSuccess: () =>
      Promise.all(
        ["partner-assignments", "partner-assignment", "partner-me"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
      ),
  });
};

export const useUploadDoorPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, file }) => PartnerApi.uploadDoorPhoto(assignmentId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-assignment"] }),
  });
};

// { assignmentId, method, rejectedItems }: see PartnerApi.doorQr. The screen keeps the answer; nothing to refetch.
export const useDoorQr = () =>
  useMutation({ mutationFn: ({ assignmentId, method, rejectedItems }) => PartnerApi.doorQr(assignmentId, method, rejectedItems) });

// While a QR is on screen: every 3 s, until it is paid or the screen stops asking (enabled false).
export const useDoorQrStatus = (assignmentId, enabled) => {
  const { data } = useQuery({
    queryKey: ["partner-door-qr", assignmentId],
    queryFn: () => PartnerApi.doorQr(assignmentId, "GET"),
    enabled: Boolean(assignmentId) && enabled,
    refetchInterval: 3000,
    gcTime: 0,
  });

  return data?.data || null;
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

// A step on one handover card (dir "in" | "out"). `run(step)` resolves the response, or null when it failed. Like
// useJobAction: a 409 re-reads the handover, and if it already moved on (the other partner acted, a second tap) the
// rider gets a short note instead of an error; a received one sends them Home.
export const useHandoverAction = (handover, dir) => {
  const step = useHandoverStep();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const run = async (name) => {
    try {
      return await step.mutateAsync({ handoverId: handover.id, step: name });
    } catch (error) {
      if (error.response?.status === 409) {
        const list = await queryClient
          .fetchQuery({ queryKey: ["partner-handovers", dir], queryFn: () => PartnerApi.getHandovers(dir), staleTime: 0 })
          .catch(() => null);
        const fresh = list?.data?.find((row) => row.id === handover.id);
        if (fresh && fresh.status !== handover.status) {
          refreshAfterHandover(queryClient);
          notify.info(`This handover is already ${(HANDOVER_LABEL[fresh.status] ?? "finished").toLowerCase()}`);
          if (fresh.status === "COMPLETED") navigate("/partner/home", { replace: true });
          return null;
        }
      }
      notify.apiError(error);
      return null;
    }
  };

  return { run, busy: step.isPending };
};

// online: true | false. Resolves once partner-me has been refetched, so the switch never shows the old state.
export const useSetOnline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (online) => PartnerApi.setOnline(online),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-me"] }),
  });
};
