class ProductRepository {

    async createProduct(productData) {

        if (productData) {

            const db = await initializeModels();

            return await db.Product.create(productData);
   
    }
    else{
        return null;
    }
}
}


