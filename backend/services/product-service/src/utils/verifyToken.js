import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

  const verifyAccessToken=(token)=>{
    try {
      if (!token || typeof token !== "string" || token === "undefined" || token === "null") {
        throw new Error("malformed or missing token");
      }
      return jwt.verify(token, env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }   
  }
  export default verifyAccessToken;