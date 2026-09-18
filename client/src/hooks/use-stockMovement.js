import {useMutation, useQuery,useQueryClient} from "@tanstack/react-query";
import  stockMovementApi  from "@/apis/stockMovementApi";
import { notify } from "@/lib/notify";


const useStockMovement = (page = 1, limit = 10, searchTerm = "") => {
  const queryClient = useQueryClient();
  const {data: stockMovements, isLoading, error} = useQuery({
    queryKey: ["stockMovements", page, limit, searchTerm],
    queryFn: () => stockMovementApi.getAllStockMovements(page, limit),
  });

  //crete stock movement
  const createMutation = useMutation({
    mutationFn: (data) => stockMovementApi.createStockMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      notify.success("Stock movement recorded successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to record stock movement");
    },
  });
  return {
    stockMovements,
    isLoading,
    error,
    createMutation
  };
}
export default useStockMovement;