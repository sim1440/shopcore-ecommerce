# ShopCore API

A scalable RESTful e-commerce API built with Node.js and Express. Features JWT authentication, product and category management, cart and order processing, Stripe payments, and MySQL persistence with input validation and XSS/SQL injection protection.

---

## Features

- **JWT Authentication** — Register, login, refresh tokens, logout with secure bcrypt password hashing
- **Role-Based Access Control** — Customer and Admin roles with protected routes
- **Product & Category Management** — Full CRUD with nested subcategories, search, filtering, and pagination
- **Shopping Cart** — Add, update, remove items with stock validation
- **Order Processing** — Place orders, track history, cancel orders
- **Stripe Payments** — Payment intent creation and webhook handling
- **Coupon & Discount System** — Percentage/fixed coupons with expiry, usage limits, and minimum order validation
- **AI-Powered Recommendations** — Claude AI analyzes purchase history to suggest personalized products
- **Real-Time Order Tracking** — WebSocket (Socket.io) broadcasts live order status updates
- **Admin Dashboard API** — Revenue stats, user management, order management
- **Security** — Helmet, CORS, XSS protection, HPP, rate limiting, SQL injection prevention

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL + Sequelize ORM |
| Authentication | JWT + bcryptjs |
| Payments | Stripe |
| Real-Time | Socket.io |
| AI | Anthropic Claude API |
| Validation | express-validator |
| Security | helmet, xss-clean, hpp, express-rate-limit |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL 8+

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/shopcore.git
cd shopcore

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values
```

### Environment Variables

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopcore
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret

STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

ANTHROPIC_API_KEY=sk-ant-xxxx

CLIENT_URL=http://localhost:3000
```

### Database Setup

```sql
CREATE DATABASE shopcore;
CREATE USER 'shopcore_user'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON shopcore.* TO 'shopcore_user'@'localhost';
FLUSH PRIVILEGES;
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | Logout | Protected |
| GET | `/api/auth/me` | Get current user | Protected |

### Products
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/products` | List all products (search, filter, paginate) | Public |
| GET | `/api/products/:id` | Get single product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Soft delete product | Admin |

### Categories
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/categories` | List all categories with subcategories | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Cart
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/cart` | Get user cart | Protected |
| POST | `/api/cart` | Add item to cart | Protected |
| PUT | `/api/cart/:itemId` | Update item quantity | Protected |
| DELETE | `/api/cart/:itemId` | Remove item | Protected |
| DELETE | `/api/cart` | Clear cart | Protected |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/orders` | Place order | Protected |
| GET | `/api/orders` | Get my orders | Protected |
| GET | `/api/orders/:id` | Get order details | Protected |
| PATCH | `/api/orders/:id/cancel` | Cancel order | Protected |

### Payments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/payments/create-intent` | Create Stripe payment intent | Protected |
| POST | `/api/payments/webhook` | Stripe webhook handler | Public |

### Coupons
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/coupons/validate` | Validate and preview discount | Protected |

### AI Recommendations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/recommendations` | Get AI-powered product recommendations | Protected |

### Admin
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats & revenue | Admin |
| GET | `/api/admin/users` | List all users | Admin |
| PATCH | `/api/admin/users/:id/toggle` | Activate/deactivate user | Admin |
| PATCH | `/api/admin/orders/:id/status` | Update order status | Admin |
| GET | `/api/admin/coupons` | List all coupons | Admin |
| POST | `/api/admin/coupons` | Create coupon | Admin |
| DELETE | `/api/admin/coupons/:id` | Delete coupon | Admin |

---

## Real-Time Order Tracking

Connect via Socket.io and join an order room to receive live status updates:

```javascript
const socket = io('http://localhost:5000');

// Join order room
socket.emit('join_order_room', 'your-order-id');

// Listen for updates
socket.on('order_update', ({ orderId, status }) => {
  console.log(`Order ${orderId} is now: ${status}`);
});
```

---

## Project Structure

```
shopcore/
├── src/
│   ├── config/
│   │   ├── database.js       # Sequelize MySQL connection
│   │   └── socket.js         # Socket.io setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   └── recommendationController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT + role guard
│   │   └── errorHandler.js   # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   └── Coupon.js
│   ├── routes/
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT access tokens (7d) + refresh tokens (30d)
- Helmet sets secure HTTP headers
- XSS-clean sanitizes request data
- HPP prevents HTTP parameter pollution
- Rate limiting: 100 requests per 15 minutes per IP
- SQL injection prevented via Sequelize parameterized queries

---

## License

MIT
