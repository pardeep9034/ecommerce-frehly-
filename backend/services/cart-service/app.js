import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import addToCartRoutes from "./src/modules/addToCart/addToCart.routes.js";
import ResponseUtil from "./src/utils/response.js"
import logger from "./src/utils/Logger.js";

dotenv.config();

const app=express();


app.use(helmet());

app.use(cors({
    origin:process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials:true
}))

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));

//REQUEST LOGGING

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// ROUTES

app.use("/cart",addToCartRoutes);



// HEALTH CHECK

app.get("/",(req,res)=>{
    res.json({
        message:"Cart Service",
        version:"1.0.0",
        status:"running"
    })
})

//GLOBAL ERROR HANDLER

app.use((error, req, res, next) => {

  logger.error(`${error.statusCode || 500} | ${error.message} | ${req.method} ${req.originalUrl}`);

  if (error.name === "SequelizeValidationError") {

    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));

    return ResponseUtil.validationError(res, errors);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return ResponseUtil.error(res, "Resource already exists", 400);
  }

  if (error.isOperational) {
    return ResponseUtil.error(res, error.message, error.statusCode);
  }

  ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error"
  );
});

export default app;