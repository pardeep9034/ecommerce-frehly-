import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import addToCartRoutes from "./src/modules/addToCart/addToCart.routes.js";
import ResponseUtil from "./src/utils/response.js"

dotenv.config();

const app=express();


app.use(helmet());

app.use(cors({
    origin:process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials:true
}))

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));

app.use((req, res, next) => {
    console.log("Body:", req.body);
    next();
});

//REQUEST LOGGING

if(process.env.NODE_ENV === "development"){
    app.use((req,res,next)=>{
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    })
}

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

  console.error("Global error handler:", error);

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

  ResponseUtil.error(
    res,
    process.env.NODE_ENV === "development"
      ? error.message
      : "Internal server error"
  );
});

export default app;