# Masala Webpage 🌶️

![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=github-actions&logoColor=white)

A production-ready Node.js + Express web application with EJS server-rendered views and a MySQL backend, covering a public/user-facing storefront and an admin panel — hardened with security middleware, rate limiting, input validation, and containerized deployment.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API / Routes Overview](#api--routes-overview)
- [Security](#security)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

- **Runtime:** Node.js, Express
- **Views:** EJS templates (`views/user/`, `views/admin/`)
- **Database:** MySQL (via `mysql2` connection pool)
- **Security & Middleware:** `helmet`, `express-rate-limit`, `express-validator`, `cors`, `compression`, `dotenv`
- **Process management (production):** PM2
- **Containerization:** Docker

## Architecture

```
┌─────────────┐      HTTPS       ┌───────────────────────┐
│   Browser   │ ───────────────▶ │    Express App         │
│ (EJS views) │ ◀─────────────── │    (index.js)            │
└─────────────┘                  │    ├─ helmet              │
                                  │    ├─ cors                 │
                                  │    ├─ compression            │
                                  │    ├─ rate-limit               │
                                  │    └─ routes/                    │
                                  │        ├─ user.js                  │
                                  │        └─ admin.js                   │
                                  └────────────┬──────────────────────┘
                                               │ mysql2 pool
                                               ▼
                                      ┌────────────────────┐
                                      │    MySQL Database     │
                                      └────────────────────┘
```

Requests pass through the security middleware stack before reaching route handlers, which validate input with `express-validator` and run parametrized queries against a pooled MySQL connection (`conn.js`).

## Features

- Public storefront with product listing, search, and filtering
- User registration and login
- Admin panel for managing products and orders
- Parametrized SQL queries and input validation on key routes
- Security headers, rate limiting, and CORS configured for production
- Environment-based configuration via `.env`

## Project Structure

```
.
├── index.js                # App entry point, middleware setup
├── conn.js                 # MySQL connection pool
├── routes/
│   ├── admin.js             # Admin routes (products, orders)
│   └── user.js               # User routes (auth, browsing)
├── views/
│   ├── user/                # Public-facing EJS views (home, navbar, footer)
│   └── admin/                # Admin EJS views
├── public/
│   ├── images/               # Static assets
│   └── js/                    # Client-side search/filter scripts
├── .env.example
├── ecosystem.config.js       # PM2 config
├── Dockerfile
└── .github/workflows/ci.yml  # CI pipeline
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- MySQL server
- npm

### Installation

```bash
git clone <repo-url>
cd masala-webpage
npm install
```

### Configuration

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_NAME` | Database name | `masala` |
| `DB_CONN_LIMIT` | mysql2 pool connection limit | `10` |
| `SESSION_SECRET` | Secret for session/cookie signing | `change_me` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed origin(s) for CORS | `http://localhost:3000` |

> Never commit `.env` — it's excluded via `.gitignore`. Use `.env.example` as the template for new environments.

## Database Schema

Core tables (adjust to match your actual schema):

```sql
-- users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- products
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(255),
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- orders
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- order_items
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Running Locally

```bash
node index.js
```

The app should be available at `http://localhost:3000`, with the admin panel at `/admin/login`.

### Running with PM2 (production)

```bash
pm2 start ecosystem.config.js
```

### Running with Docker

```bash
docker build -t masala-webpage .
docker run -p 3000:3000 --env-file .env masala-webpage
```

## API / Routes Overview

### Public / User Routes (`routes/user.js`)

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Public home page | No |
| `GET` | `/products` | List products (supports `?search=&category=&page=`) | No |
| `GET` | `/products/:id` | Product detail | No |
| `POST` | `/user/register` | Create a new user account | No |
| `POST` | `/user/login` | Authenticate user, start session | No |
| `POST` | `/user/logout` | End session | Yes |
| `POST` | `/user/orders` | Place an order | Yes |
| `GET` | `/user/orders` | List logged-in user's orders | Yes |

### Admin Routes (`routes/admin.js`)

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/admin/login` | Admin login page | No |
| `POST` | `/admin/login` | Authenticate admin | No |
| `GET` | `/admin/dashboard` | Admin overview | Admin |
| `POST` | `/admin/products` | Add a product | Admin |
| `PUT` | `/admin/products/:id` | Update a product | Admin |
| `DELETE` | `/admin/products/:id` | Remove a product | Admin |
| `GET` | `/admin/orders` | View all orders | Admin |
| `PATCH` | `/admin/orders/:id` | Update order status | Admin |

### Example Request

```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "yourpassword"}'
```

### Example Response

```json
{
  "success": true,
  "user": { "id": 12, "name": "Rohan", "role": "user" }
}
```

## Security

- **Helmet** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **express-rate-limit** — throttles repeated requests per IP to mitigate brute-force/DoS
- **express-validator** — sanitizes and validates all request bodies/params
- **Parametrized queries** — all SQL goes through `mysql2` placeholders, never string concatenation
- **CORS** — restricted to `CORS_ORIGIN`
- **dotenv** — secrets loaded from environment, never hardcoded
- **Password hashing** — passwords stored using a salted hash (e.g. `bcrypt`), never plaintext

> If you discover a security issue, please open a private report rather than a public issue.

## Testing

```bash
npm test
```

- Unit tests for route handlers and validation logic
- Integration tests against a test MySQL database (see `DB_NAME=masala_test` in `.env.test`)
- Run `npm run lint` to check code style before committing

## Development Notes

- All new SQL queries should use parametrized statements (no string concatenation).
- Validate all incoming request bodies with `express-validator`.
- Keep secrets out of source control — use `.env` (already covered by `.gitignore`).
- Follow the branching model below and keep commits scoped and descriptive.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `blackboxai/enhancements` and `main`:

1. Install dependencies (`npm ci`)
2. Lint (`npm run lint`)
3. Run tests (`npm test`)
4. (Optional) Build Docker image as a smoke test

## Deployment

### Option 1 — PM2 on a VPS

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 2 — Docker

```bash
docker build -t masala-webpage .
docker run -d -p 3000:3000 --env-file .env --name masala masala-webpage
```

### Option 3 — Docker Compose (app + MySQL)

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: masala
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
volumes:
  db_data:
```

## Screenshots

| Home Page | Admin Dashboard |
|---|---|
| _add screenshot_ | _add screenshot_ |

## Roadmap

- [ ] JWT-based API auth for a future mobile client
- [ ] Redis caching for product listings
- [ ] Payment gateway integration
- [ ] Automated image optimization pipeline on upload
- [ ] Multi-language support

## Contributing

1. Fork the repo and create a feature branch from `blackboxai/enhancements`
2. Follow existing code style and add tests for new logic
3. Run `npm run lint && npm test` before opening a PR
4. Open a PR with a clear description of changes and testing performed
5. Link any related issues

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.