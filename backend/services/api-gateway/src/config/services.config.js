import dotenv from "dotenv";
dotenv.config();

export default [
  {
    route: "/products",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/inventory",
    target: process.env.INVENTORY_SERVICE_URL
  },
  {
    route: "/auth",
    target: process.env.AUTH_SERVICE_URL
  },
  {
    route: "/delivery",
    target: process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3000"
  },
  {
    route: "/users",
    target: process.env.USER_SERVICE_URL || "http://user-service:3000"
  }
];

