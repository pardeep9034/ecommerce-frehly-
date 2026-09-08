import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProductApi from "@/apis/productApi";

const useProduct = ({page = 1, limit = 10,type,catId,search}) => {
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
  
  const {
    data: catProducts,
    isLoading: catProductsIsLoading,
    error: catProductsError,
  } = useQuery({
    queryKey: ["catProducts", catId, page, limit],
    queryFn: () =>
      ProductApi.getProductByCategory(catId, page, limit),
    enabled: !!catId,
  });
  const {
    data:productSelection,
    isLoading:productSelectionLoading,
    error:productSelectionError
  }=useQuery({
    queryKey:["productSelection",search,page,limit],
    queryFn:()=>ProductApi.productSelection(search,page,limit)
  })
  const {
data:searchedProduct,
isLoading:searchedProductLoading,
error:searchedProductError
  }=useQuery({
    queryKey:["searchProduct",search],
    queryFn:()=>ProductApi.searchVariants(search),
    enabled:!!search
  })
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
    catProducts,
    catProductsIsLoading,
    catProductsError,
    productSelection,
    productSelectionLoading,
    productSelectionError,
    searchedProduct,
    searchedProductLoading,
    searchedProductError,
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
