import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.config.js";

const registerProxies = (app) => {

  services.forEach((service) => {
    
    app.use(
      service.route,
      createProxyMiddleware({
        target: service.target,
        pathRewrite: (path) => `${service.route}${path}`,
        changeOrigin: true,
        logLevel: "debug",
        on:{
          error: (err, req, res) => {
            console.error(`Error proxying request to ${service.name}:`, err);
            res.status(500).send("service temprorarily unavailable");
          }

        }
      })
    );

  });

};

export default registerProxies;