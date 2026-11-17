# Inventory and Data Management System

REST API built with Node.js, Express, MongoDB and Mongoose to manage a product catalogue:
CRUD, filtering/sorting/pagination, stock adjustment, low-stock report and category summary (aggregation).

## Setup
1. Install and start MongoDB locally (or use a MongoDB Atlas connection string).
2. Copy `.env.example` to `.env` and set `MONGO_URI` if needed.
3. Install and run:
```bash
npm install
npm run seed     # optional: inserts 12 sample products
npm start        # http://localhost:5000
```

## Project Structure
```
server.js                      # DB connection + server start
app.js                         # express app, middleware, routes
seed.js                        # sample data
config/db.js                   # mongoose connection
models/Product.js              # schema + validation + stockValue virtual
controllers/productController.js
routes/productRoutes.js
middleware/                    # validate.js, errorHandler.js, asyncHandler.js
utils/AppError.js
```

## Endpoints
| Method | URL | Description |
|---|---|---|
| POST | /api/products | Create product (201) |
| GET | /api/products | List with filter, sort, pagination |
| GET | /api/products/:id | Get one product |
| PUT | /api/products/:id | Update product details |
| PATCH | /api/products/:id/stock | Adjust stock: `{ "change": 10 }` restock, `{ "change": -3 }` sale |
| DELETE | /api/products/:id | Delete product |
| GET | /api/products/low-stock | Products with quantity <= reorderLevel |
| GET | /api/products/summary | Category-wise summary (aggregation) |

### Query parameters for GET /api/products
`category`, `supplier`, `search` (name), `minPrice`, `maxPrice`, `inStock=true|false`, `lowStock=true`,
`sort` (e.g. `price`, `-price`, `category,-quantity`), `page`, `limit` (default 10, max 100).

Example: `/api/products?category=Electronics&minPrice=500&sort=-price&page=1&limit=5`

## Status codes
200 OK, 201 Created, 400 validation / bad ID / insufficient stock, 404 not found, 409 duplicate SKU, 500 server error.

## Product fields
`name`, `sku` (unique), `category`, `price`, `quantity`, `reorderLevel`, `supplier`, plus virtual `stockValue = price x quantity`.
Valid categories: Electronics, Apparel, Furniture, Stationery, Grocery, Books, Sports, Toys, Other.
