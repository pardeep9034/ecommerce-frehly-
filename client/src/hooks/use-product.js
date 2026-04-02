import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";

const useProduct = (page = 1, limit = 10,type) => {
  const queryClient = useQueryClient();

  // GET - fetch all products with pagination
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", page, limit],
    queryFn: () => ProductApi.getAllProducts(page, limit),
  });

  // POST - create product
  const createMutation = useMutation({
    mutationFn: (data) => ProductApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // PUT - update product
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ProductApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // DELETE - delete product
  const deleteMutation = useMutation({
    mutationFn: (id) => ProductApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  //product by promotion type
  const productsByType = useQuery({
    queryKey: ["products-by-type", type, page, limit],
    queryFn: () => ProductApi.getProductsByType(type, page, limit),
    enabled: !!type,
  });

  return {
    products,
    isLoading,
    error,
    createProduct: createMutation,
    updateProduct: updateMutation,
    deleteProduct: deleteMutation,
    productsByType,
  };
};

export default useProduct;
