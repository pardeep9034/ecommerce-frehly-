# Delivery Service Structure

This service follows the same backend service pattern documented in Product Service: root runtime files, Sequelize configuration and migrations, and source code grouped under `src`.

## Folder Structure

```text
delivery-service/
├── .env
├── .gitignore
├── Dockerfile
├── app.js
├── config/
│   └── config.json
├── migrations/
│   └── create-delivery-tables.cjs
├── package.json
├── server.js
└── src/
    ├── config/
    │   ├── database.js
    │   └── env.js
    ├── models/
    │   ├── DeliveryAssignment.js
    │   ├── DeliveryAssignmentHistory.js
    │   ├── DeliveryAttempt.js
    │   ├── DeliveryHandover.js
    │   ├── DeliveryPartner.js
    │   ├── DeliverySlot.js
    │   ├── DeliveryStatusHistory.js
    │   └── index.js
    ├── modules/
    │   ├── delivery/
    │   ├── deliveryPartner/
    │   └── repository/
    └── utils/
        └── response.js
```

## Naming Convention

- Service folders use kebab-case: `delivery-service`.
- Database tables and columns use snake_case: `delivery_partners`, `delivery_partner_id`, `created_at`.
- Migration files use timestamp prefix plus kebab-case description: `20260712000000-create-delivery-tables.cjs`.
- Sequelize model files use PascalCase for main entities: `DeliveryPartner.js`, `DeliveryAssignment.js`.
- Module files use `<feature>.<layer>.js`: `delivery.controller.js`, `delivery.services.js`, `delivery.routes.js`.
- Repository files use `<entity>.repository.js`: `deliveryPartner.repository.js`, `deliveryAssignment.repository.js`.
- Environment variables use UPPER_SNAKE_CASE: `DATABASE_URL`, `ALLOWED_ORIGINS`.

## Notes

- `order_id`, `assigned_by`, and `changed_by` are cross-service references, so they remain plain UUID columns.
- Sequelize associations are defined only between delivery-owned tables.
- Delivery lifecycle history is append-only through `delivery_status_history`.
