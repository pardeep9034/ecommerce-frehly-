import ProductRepository from "../repository/product.repository.js";
const ProductServices = {
    async getAllProducts(limit,offset) {
      const { count, rows } = await new ProductRepository().getAllProducts(limit,offset);
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(count / limit);
     return {
      success: true,
      data: {
        products: rows,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage,
          limit,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      },
    };
    },
    
    async getProductById(id) {
        const product = await new ProductRepository().getProductById(id);
        return {
            success: true,
            data: product,
        };
    },
    async createProduct(productData) {
        const { name, description, categoryId,productType,isOrganic, images, status } = productData;
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        if (!name || !description || !categoryId || !productType || !status) {
            return {
                success: false,
                message: "All fields are required",
            };
        }
        const product = await new ProductRepository().createProduct({
            name,
            slug,
            description,
            categoryId,
            productType,
            isOrganic,
            images,
            status,
        });
        return {
            success: true,
            data: product,
        };
    },
    
    async updateProduct(id, productData) {
        // Logic to update an existing product
    },
    async deleteProduct(id) {
        // Logic to delete a product
    }
    

};

export default ProductServices;