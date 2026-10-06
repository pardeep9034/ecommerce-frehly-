import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategories, createCategory, updateCategory, deleteCategory ,fetchAllCategories} from "@/apis/categoryApi";
import { notify } from "@/lib/notify";

const useCategory = ( searchTerm = "") => {
  const queryClient = useQueryClient();

  // GET - fetch categories with pagination
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });
  // GET - fetch all categories for selection
  const {
    data: allCategories,
    isLoading: isLoadingAllCategories,
    error: errorAllCategories,
  } = useQuery({
    queryKey: ["allCategories", searchTerm],
    queryFn: () => fetchAllCategories(searchTerm),
  });

  // POST - create category
  const createMutation = useMutation({
    mutationFn:(data) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      notify.success("Category created successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to create category");
    },
  });

  // PUT - update category
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      notify.success("Category updated successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to update category");
    },
  });

  // DELETE - delete category
  const deleteMutation = useMutation({
    mutationFn:(id)=> deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      notify.success("Category deleted successfully");
    },
    onError: (error) => {
      notify.apiError(error, "Failed to delete category");
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