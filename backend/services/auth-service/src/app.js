
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from "cookie-parser";

import authRoutes from './modules/auth/auth.routes.js';
import optRoutes from "./modules/otp/otp.routes.js"
import ResponseUtil from './utils/response.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ,
  credentials: true
}));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Routes
app.use('/', authRoutes);
app.use("/otp",optRoutes)

// Root health check
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Veggie E-commerce Auth Service',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message
    }));
    return ResponseUtil.validationError(res, errors);
  }
  
  // Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    return ResponseUtil.error(res, 'Resource already exists', 400);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return ResponseUtil.unauthorized(res, 'Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return ResponseUtil.unauthorized(res, 'Token expired');
  }
  
  // Default error
  ResponseUtil.error(res, 
    process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  );
});

// module.exports = app;
export default app;