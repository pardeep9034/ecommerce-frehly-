import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import activityLogApi from "@/apis/activityLogApi";

// Every key starts with this, so the page's refresh button can invalidate them all at once.
export const ACTIVITY_LOG = "activityLog";

const useLog = (source, params, enabled) => {
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [ACTIVITY_LOG, source, params],
    queryFn: () => activityLogApi[source](params),
    enabled,
    placeholderData: keepPreviousData,
  });
  return {
    events: data?.events ?? [],
    pagination: data?.pagination,
    meta: data?.meta,
    isLoading,
    isError,
    isFetching,
  };
};

// A tab's chip + search + page state. Search goes to the server after a pause in typing; any change goes back to page 1.
export const useLogFilters = (hours) => {
  const [group, setGroup] = useState("");
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(term.trim()), 400);
    return () => clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    setPage(1);
  }, [group, search, hours]);

  return { group, setGroup, term, setTerm, page, setPage, params: { group: group || undefined, hours, search: search || undefined, page, limit: 20 } };
};

export const useSecurityLog =(params, { enabled = true } = {}) => useLog("security", params, enabled);
export const useOnboardingLog = (params, { enabled = true } = {}) => useLog("onboarding", params, enabled);
