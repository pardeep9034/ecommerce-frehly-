import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, createCategory, updateCategory, deleteCategory ,fetchAllCategories} from "@/apis/categoryApi";

const useCategory = (page = 1, limit = 10, searchTerm = "") => {
  const queryClient = useQueryClient();

  // GET - fetch categories with pagination
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories", page, limit],
    queryFn: () => fetchCategories(page, limit),
  });
  // GET - fetch all categories for selection
  const {
    data: allCategories,
    isLoading: isLoadingAllCategories,
    error: errorAllCategories,
  } = useQuery({
    queryKey: ["allCategories", page, limit,searchTerm],
    queryFn: () => fetchAllCategories(page,limit,searchTerm),
  });

  // POST - create category
  const createMutation = useMutation({
    mutationFn:(data) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // PUT - update category
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // DELETE - delete category
  const deleteMutation = useMutation({
    mutationFn:(id)=> deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories,
    isLoading,
    error,
    allCategories,
    isLoadingAllCategories,
    errorAllCategories,
    createCategory: createMutation,
    updateCategory: updateMutation,
    deleteCategory: deleteMutation,
  };
};

export default useCategory;