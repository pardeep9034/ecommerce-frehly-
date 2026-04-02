import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

dotenv.config();

const app=express();


app.use(helmet());

app.use(cors({
    origin:process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials:true
}))

app.use(express.json({limit:"10mb"}));
app.use(express.urlencoded({extended:true}));

app.use((req,res,next)=>{
    console.log("Incoming request:",req.method,req.originalUrl);
    next();
})

//REQUEST LOGGING

if(process.env.NODE_ENV === "development"){
    app.use((req,res,next)=>{
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    })
}

// ROUTES



// HEALTH CHECK

app.get("/",(req,res)=>{
    res.json({
        message:"Cart Service",
        version:"1.0.0",
        status:"running"
    })
})

