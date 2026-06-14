import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.config.js";

const registerProxies = (app) => {

  services.forEach((service) => {
    
    app.use(
      service.route,
      createProxyMiddleware({
        target: service.target,
        changeOrigin: true,
        
        logLevel: "debug"
      })
    );

  });

};

export default registerProxies;