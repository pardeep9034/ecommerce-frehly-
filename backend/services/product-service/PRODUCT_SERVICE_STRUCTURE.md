# Product Service Structure

This service follows the backend microservice pattern used in this repository: root runtime files, Sequelize configuration and migrations, and source code grouped under `src`.

## Folder Structure

```text
product-service/
├── .env
├── .gitignore
├── Dockerfile
├── app.js
├── config/
│   └── config.json
├── migrations/
│   ├── create-categories.cjs
│   ├── create-brands.cjs
│   ├── create-product-types.cjs
│   ├── create-measurement-unit.cjs
│   ├── create-products.cjs
│   ├── create-product_attributes.cjs
│   ├── create-product_variants.cjs
│   └── create-product_images.cjs
├── package.json
├── server.js
└── src/
    ├── config/
    │   ├── database.js
    │   └── env.js
    ├── middleware/
    │   ├── auth.js
    │   └── validate.js
    ├── models/
    │   ├── Brand.model.js
    │   ├── Category.model.js
    │   ├── MeasurementUnit.model.js
    │   ├── Product.model.js
    │   ├── ProductAttribute.model.js
    │   ├── ProductImage.model.js
    │   ├── ProductStats.model.js
    │   ├── ProductType.model.js
    │   ├── ProductVariant.model.js
    │   ├── Promotion.model.js
    │   ├── PromotionItem.model.js
    │   └── index.js
    ├── modules/
    │   ├── brand/
    │   ├── category/
    │   ├── measurementUnit/
    │   ├── product/
    │   ├── productAttribute/
    │   ├── productImage/
    │   ├── productType/
    │   ├── productVariant/
    │   ├── promotion/
    │   ├── promotionItem/
    │   └── repository/
    └── utils/
        ├── AppError.js
        ├── helper.js
        ├── response.js
        ├── slugMaker.js
        └── verifyToken.js
```

## Naming Convention

- Service folders use kebab-case: `product-service`, `cart-service`, `order-service`.
- Database tables and columns use snake_case: `product_variants`, `product_id`, `created_at`.
- Migration files use timestamp prefix plus kebab-case description: `20260629070553-create-products.cjs`.
- Sequelize model files use PascalCase plus a `.model.js` suffix: `Product.model.js`, `ProductVariant.model.js`, `PromotionItem.model.js`.
- Module folders use camelCase by feature: `productType`, `measurementUnit`, `promotionItem`.
- Module files use `<feature>.<layer>.js`: `category.controller.js`, `category.service.js`, `category.routes.js`.
- Repository files use `<entity>.repository.js`: `product.repository.js`, `variant.repository.js`.
- Utility files use camelCase or PascalCase by export type: `response.js`, `slugMaker.js`, `AppError.js`.
- Environment variables use UPPER_SNAKE_CASE: `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGINS`.

## Notes

- Keep cross-service IDs as plain columns unless the table belongs to the same service database.
- Define Sequelize associations only between models owned by this service.
- Use `created_at` and `updated_at` column names through Sequelize `createdAt` and `updatedAt` options.
