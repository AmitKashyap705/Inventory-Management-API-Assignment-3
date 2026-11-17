const mongoose = require("mongoose");

const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Furniture",
  "Stationery",
  "Grocery",
  "Books",
  "Sports",
  "Toys",
  "Other",
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]+$/, "SKU can only contain letters, numbers and hyphens"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "Quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, "Reorder level cannot be negative"],
    },
    supplier: {
      type: String,
      trim: true,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: total value of stock for this product
productSchema.virtual("stockValue").get(function () {
  return this.price * this.quantity;
});

// Index to speed up category filtering and low-stock queries
productSchema.index({ category: 1 });

module.exports = mongoose.model("Product", productSchema);
