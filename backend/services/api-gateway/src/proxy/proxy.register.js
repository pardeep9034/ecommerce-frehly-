import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.config.js";
import logger from "../utils/Logger.js";

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
            logger.error(`Error proxying request to ${service.name}: ${err.message}`);
            res.status(500).send("service temprorarily unavailable");
          }

        }
      })
    );

  });

};

export default registerProxies;