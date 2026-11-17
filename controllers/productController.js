const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");

// Only these fields can be set by the client (prevents mass-assignment)
const ALLOWED_FIELDS = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];
const SORTABLE_FIELDS = ["name", "sku", "category", "price", "quantity", "createdAt", "updatedAt"];

const pickAllowed = (body) => {
  const data = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toNumber = (value, name) => {
  const num = Number(value);
  if (Number.isNaN(num)) throw new AppError(`'${name}' must be a number`, 400);
  return num;
};

// Builds a MongoDB filter from the query string
const buildFilter = (query) => {
  const filter = {};

  if (query.category) filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  if (query.supplier) filter.supplier = new RegExp(escapeRegex(query.supplier), "i");
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), "i");

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = toNumber(query.minPrice, "minPrice");
    if (query.maxPrice !== undefined) filter.price.$lte = toNumber(query.maxPrice, "maxPrice");
  }

  if (query.inStock === "true") filter.quantity = { $gt: 0 };
  if (query.inStock === "false") filter.quantity = 0;

  if (query.lowStock === "true") filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };

  return filter;
};

// Builds a sort object from ?sort=price,-quantity
const buildSort = (sortParam) => {
  const sort = {};
  const fields = sortParam ? String(sortParam).split(",") : ["-createdAt"];
  fields.forEach((raw) => {
    const field = raw.trim().replace(/^-/, "");
    if (!SORTABLE_FIELDS.includes(field)) {
      throw new AppError(`Cannot sort by '${field}'. Allowed: ${SORTABLE_FIELDS.join(", ")}`, 400);
    }
    sort[field] = raw.trim().startsWith("-") ? -1 : 1;
  });
  sort._id = 1; // stable ordering for pagination
  return sort;
};

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pickAllowed(req.body));
  res.status(201).json(product);
});

// GET /api/products?category=&minPrice=&maxPrice=&search=&inStock=&sort=&page=&limit=
const getProducts = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);
  const sort = buildSort(req.query.sort);

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
  ]);

  res.status(200).json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json(product);
});

// PUT /api/products/:id  (update product details)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: pickAllowed(req.body) },
    { new: true, runValidators: true }
  );
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json(product);
});

// PATCH /api/products/:id/stock  body: { "change": 10 } (restock) or { "change": -3 } (sale)
const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  if (!Number.isInteger(change) || change === 0) {
    throw new AppError("'change' must be a non-zero integer (positive = restock, negative = sale)", 400);
  }

  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: -change }; // block overselling

  // Atomic update: safe even with simultaneous requests
  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true, runValidators: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("Insufficient stock for this sale", 400);
  }

  res.status(200).json({ message: "Stock updated", product });
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json({ message: "Product deleted", id: product.id });
});

// GET /api/products/low-stock  (quantity <= reorderLevel)
const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  }).sort({ quantity: 1, _id: 1 });

  res.status(200).json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary  (aggregation: category-wise inventory summary)
const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" },
      },
    },
    { $addFields: { avgPrice: { $round: ["$avgPrice", 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.status(200).json({ categories: summary.length, summary });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
