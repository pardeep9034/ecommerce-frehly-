import dotenv from "dotenv";
dotenv.config();

export default [
  {
    route: "/product-type",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/product-image",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/product-variant",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/product-attribute",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/product",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/category",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/brand",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/units",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/promotion-items",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/promotions",
    target: process.env.PRODUCT_SERVICE_URL
  },
  {
    route: "/inventory",
    target: process.env.INVENTORY_SERVICE_URL
  },
  {
    route: "/stock-movements",
    target: process.env.INVENTORY_SERVICE_URL
  },
  {
    route: "/stock-reservations",
    target: process.env.INVENTORY_SERVICE_URL
  },
  {
    route: "/warehouses",
    target: process.env.INVENTORY_SERVICE_URL
  },

  {
    route: "/auth",
    target: process.env.AUTH_SERVICE_URL
  },
  {
    route: "/otp",
    target: process.env.AUTH_SERVICE_URL
  },
  {
    route: "/user-addresses",
    target: process.env.AUTH_SERVICE_URL
  },
  {
    route:"/cart",
    target: process.env.CART_SERVICE_URL
  },
  {
    route: "/orders",
    target: process.env.ORDER_SERVICE_URL || "http://order-service:3004"
  },
  {
    route: "/delivery",
    target: process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3000"
  },
  {
    route: "/users",
    target: process.env.USER_SERVICE_URL || "http://user-service:3000"
  },
 
]
