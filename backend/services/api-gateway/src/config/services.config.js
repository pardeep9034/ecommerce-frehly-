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
  }
];

