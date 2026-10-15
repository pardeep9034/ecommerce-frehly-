import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import partnerApplicationApi from "@/apis/partnerApplicationApi";
import { getToken } from "@/lib/tokenStorage";

const KEY = ["partnerApplication"];

const fetchMineOrNull = async () => {
  try {
    return await partnerApplicationApi.fetchMine();
  } catch (e) {
    if ([401, 403, 404].includes(e.response?.status)) return null;
    throw e;
  }
};

// `application` is null when the caller has none (or is not a partner), undefined while loading.
const usePartnerApplication = () => {
  const queryClient = useQueryClient();

  const { data: application, isLoading, error } = useQuery({
    queryKey: KEY,
    queryFn: fetchMineOrNull,
    // No token = nobody to ask for; skipping avoids a pointless refresh round trip on the signup screen.
    enabled: !!getToken(),
    retry: false,
  });

  // These return the whole application, so the cache is replaced and the next page never sees a gap.
  // A read still in flight (started before this write) is cancelled so its older answer cannot overwrite it.
  const replace = async (data) => {
    await queryClient.cancelQueries({ queryKey: KEY });
    queryClient.setQueryData(KEY, data);
  };
  // Document calls return only the document; refetch for the new list.
  const refetch = () => queryClient.invalidateQueries({ queryKey: KEY });

  // Right after sign-up: staff may have started an application for this number (invite link). Reads it into the cache, null if none.
  const loadMine = () => queryClient.fetchQuery({ queryKey: KEY, queryFn: fetchMineOrNull, staleTime: 0 });

  const createMutation = useMutation({ mutationFn: partnerApplicationApi.create, onSuccess: replace });
  const updateMutation = useMutation({ mutationFn: partnerApplicationApi.update, onSuccess: replace });
  const submitMutation = useMutation({ mutationFn: partnerApplicationApi.submit, onSuccess: replace });
  const resubmitMutation = useMutation({ mutationFn: partnerApplicationApi.resubmit, onSuccess: replace });
  const uploadMutation = useMutation({
    mutationFn: ({ type, file, ...fields }) => partnerApplicationApi.uploadDocument(type, file, fields),
    onSuccess: refetch,
  });

  return {
    application, isLoading, error, loadMine,
    createMutation, updateMutation, submitMutation, resubmitMutation, uploadMutation,
  };
};

export default usePartnerApplication;
