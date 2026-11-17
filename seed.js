// Run with: npm run seed   (clears the products collection and inserts sample data)
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Product = require("./models/Product");

const products = [
  { name: "Study Table", sku: "FURN-TB-812", category: "Furniture", price: 3999, quantity: 2, reorderLevel: 4, supplier: "IKEA India" },
  { name: "Office Chair", sku: "FURN-CH-310", category: "Furniture", price: 5499, quantity: 15, reorderLevel: 5, supplier: "Godrej Interio" },
  { name: "Wireless Mouse", sku: "ELEC-MS-101", category: "Electronics", price: 799, quantity: 30, reorderLevel: 10, supplier: "Logitech" },
  { name: "Bluetooth Headphones", sku: "ELEC-HP-205", category: "Electronics", price: 2499, quantity: 8, reorderLevel: 10, supplier: "boAt" },
  { name: "Laptop 15 inch", sku: "ELEC-LP-550", category: "Electronics", price: 55999, quantity: 5, reorderLevel: 3, supplier: "Dell" },
  { name: "Smartphone", sku: "ELEC-SP-777", category: "Electronics", price: 13999, quantity: 3, reorderLevel: 5, supplier: "Samsung" },
  { name: "Cotton T-Shirt", sku: "APRL-TS-001", category: "Apparel", price: 499, quantity: 50, reorderLevel: 20, supplier: "Allen Solly" },
  { name: "Denim Jeans", sku: "APRL-JN-002", category: "Apparel", price: 2299, quantity: 28, reorderLevel: 10, supplier: "Levis" },
  { name: "Notebook A4", sku: "STNY-NB-100", category: "Stationery", price: 60, quantity: 200, reorderLevel: 50, supplier: "Classmate" },
  { name: "Gel Pen Pack of 10", sku: "STNY-PN-200", category: "Stationery", price: 120, quantity: 12, reorderLevel: 20, supplier: "Cello Pens" },
  { name: "Basmati Rice 5kg", sku: "GROC-RC-501", category: "Grocery", price: 650, quantity: 40, reorderLevel: 15, supplier: "India Gate" },
  { name: "Olive Oil 1L", sku: "GROC-OL-502", category: "Grocery", price: 799, quantity: 6, reorderLevel: 10, supplier: "Figaro" },
];

(async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
