import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  const statusCode =
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
};

export default errorHandler;