const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

// Rejects malformed :id params with 400 before hitting the database
const validateObjectId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError(`Invalid product ID: ${req.params.id}`, 400));
  }
  next();
};

// Rejects empty or non-object request bodies on POST / PUT
const validateBody = (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Object.keys(req.body).length === 0) {
    return next(new AppError("Request body cannot be empty", 400));
  }
  next();
};

module.exports = { validateObjectId, validateBody };
