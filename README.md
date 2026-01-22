# BOOKMATE - Book Ordering System Backend

Enterprise-grade backend API for a book ordering system with Docker containerization, CI/CD, and comprehensive security protocols.

## Features

- **User Management**: Student and Admin roles with JWT authentication
- **Book Management**: CRUD operations with image uploads (stored as base64)
- **Order Management**: Order creation, tracking, and status updates
- **Payment Integration**: OPay payment gateway integration
- **Security**: Rate limiting, input sanitization, security headers, and more
- **Docker**: Production-ready containerization
- **CI/CD**: GitHub Actions pipeline for automated testing and deployment

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT
- **Payment**: OPay Gateway
- **Security**: Helmet, Express Rate Limit
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker & Docker Compose (optional)
- npm or yarn

## Documentation

### Quick Reference
- **[COMMANDS.md](./COMMANDS.md)** - **Complete commands guide** - All commands to run, manage, and navigate the system

### Detailed Documentation (in `DOCS/` folder)
- **[QUICK-START.md](./DOCS/QUICK-START.md)** - Quick start guide
- **[DEPLOYMENT.md](./DOCS/DEPLOYMENT.md)** - Deployment guide
- **[DOCKER-README.md](./DOCS/DOCKER-README.md)** - Docker setup guide
- **[DOCKER-VERIFICATION.md](./DOCS/DOCKER-VERIFICATION.md)** - Docker verification checklist
- **[SECURITY.md](./DOCS/SECURITY.md)** - Security documentation
- **[CONFIGURATION.md](./DOCS/CONFIGURATION.md)** - Configuration details
- **[ALL-CONFIGS.txt](./DOCS/ALL-CONFIGS.txt)** - Configuration summary

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookmate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations** (if needed)
   ```bash
   npm run migration:run
   ```

5. **Create an admin user**
   ```bash
   npm run create-admin
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access the API**
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

### Docker Development

1. **Start services with Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View logs**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f api
   ```

3. **Stop services**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Docker Production

1. **Build and start production containers**
   ```bash
   docker-compose up -d --build
   ```

2. **View logs**
   ```bash
   docker-compose logs -f api
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## Environment Variables

See `.env.example` for all required environment variables.

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `OPAY_MERCHANT_ID`: OPay merchant ID
- `OPAY_PUBLIC_KEY`: OPay public key (for payment creation)
- `OPAY_SECRET_KEY`: OPay secret key (for signature-based APIs)

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Books
- `GET /books` - Get all books
- `GET /books/:id` - Get book by ID
- `POST /books` - Create book (Admin only)
- `PUT /books/:id` - Update book (Admin only)
- `DELETE /books/:id` - Delete book (Admin only)

### Orders
- `POST /orders` - Create order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order by ID

### Payments
- `POST /payments/initiate` - Initiate payment
- `POST /payments/initiate-cashier` - Initiate OPay Cashier payment
- `GET /payments/status/:reference` - Query payment status
- `POST /payments/callback` - OPay webhook callback

### Admin
- `GET /admin/orders` - Get all orders (Admin only)
- `PUT /admin/orders/:id/status` - Update order status (Admin only)

Full API documentation available at `/api-docs` when the server is running.

## Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes (production)
- **Authentication**: 5 requests per 15 minutes
- **Payments**: 10 requests per 15 minutes
- **File Uploads**: 20 uploads per hour

### Security Headers
- Helmet.js for security headers
- Content Security Policy (CSP)
- XSS Protection
- Frame Options
- HSTS (in production)

### Input Validation
- Zod schema validation
- Input sanitization
- SQL injection protection (via TypeORM)
- XSS protection

## CI/CD Pipeline

The project includes a GitHub Actions CI/CD pipeline that:

1. **Lints and Tests**: Runs linter and type checking
2. **Builds Docker Image**: Creates production-ready Docker image
3. **Security Scan**: Runs Trivy vulnerability scanner
4. **Deploys**: Deploys to production (configure deployment steps)

### Pipeline Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run create-admin` - Create an admin user
- `npm run migration:generate` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration

## Project Structure

```
bookmate/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── entities/        # TypeORM entities
│   ├── middleware/      # Express middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── scripts/             # Utility scripts
├── .github/workflows/   # CI/CD pipelines
├── Dockerfile           # Production Docker image
├── Dockerfile.dev       # Development Docker image
├── docker-compose.yml   # Production Docker Compose
└── docker-compose.dev.yml # Development Docker Compose
```

## Database Schema

- **Users**: User accounts (students and admins)
- **Books**: Book catalog
- **Orders**: Order records
- **OrderItems**: Order line items

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
