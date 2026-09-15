const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const startedAt = Date.now();
  logger.info('http.request', { method: req.method, path: req.originalUrl });

  res.on('finish', () => {
    logger.info('http.response', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt
    });
  });

  next();
}

module.exports = requestLogger;
