// 404 handler for unknown routes
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors;

  if (err.name === "ValidationError") {
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = "Validation failed";
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `Duplicate value: a product with this ${field} already exists`;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body";
  }

  if (status === 500) {
    console.error(err);
    if (process.env.NODE_ENV === "production") message = "Internal Server Error";
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };
