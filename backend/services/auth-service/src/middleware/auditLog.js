import AuditRepository from "../modules/repository/audit.repository.js";
import logger from "../utils/Logger.js";

const auditLog = (eventType) => async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    res.send = originalSend;
    const response = originalSend.call(this, body);

    const status = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILURE';
    
    // Log asynchronously to not block the response
    const logData = {
      user_id: req.user?.id || null,
      event_type: eventType,
      email: req.body?.email || req.user?.email || null,
      phone: req.body?.phone || req.user?.phone || null,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent'],
      device_id: req.headers['x-device-id'] || null,
      status: status,
      details: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        ...(status === 'FAILURE' ? { error: body } : {})
      }
    };

    AuditRepository.logEvent(logData).catch(err => {
      logger.error(`❌ Failed to write audit log: ${err.message}`);
    });

    return response;
  };

  next();
};

export default auditLog;
