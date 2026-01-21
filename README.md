# BOOKMATE - Backend API

A comprehensive Node.js + TypeScript backend for a book ordering system with PostgreSQL, TypeORM, and Swagger documentation.

## Features

- User authentication (JWT-based)
- Role-based access control (Student & Admin)
- Book management (Admin only)
- Order creation & tracking
- Payment processing integration
- Delivery status management
- Complete Swagger API documentation
- Input validation with Zod
- Error handling middleware
- TypeScript for type safety

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

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
   ```
   
   Edit `.env` and configure:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/bookmate
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PAYMENT_SECRET=your-payment-gateway-secret-key
   PAYMENT_PUBLIC_KEY=your-payment-gateway-public-key
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Create PostgreSQL database**
   ```bash
   createdb bookmate
   # Or using psql:
   # psql -U postgres
   # CREATE DATABASE bookmate;
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## API Documentation

Once the server is running, access the Swagger UI at:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user

### Books (Public)
- `GET /books` - Get all books
- `GET /books/:id` - Get book by ID

### Books (Admin Only)
- `POST /books` - Create a new book
- `PUT /books/:id` - Update a book
- `DELETE /books/:id` - Delete a book

### Orders
- `POST /orders` - Create a new order (Authenticated)
- `GET /orders` - Get my orders (Authenticated)
- `GET /orders/:id` - Get order by ID (Authenticated)

### Admin Orders
- `GET /admin/orders` - Get all orders (Admin only)
- `PUT /admin/orders/:id/status` - Update order status (Admin only)

### Payments
- `POST /payments/initiate` - Initiate payment (Authenticated)
- `POST /payments/verify` - Verify payment (Payment gateway callback)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

### User Entity
- `id` (UUID)
- `name` (string)
- `email` (string, unique)
- `password` (hashed)
- `role` (enum: 'student' | 'admin')
- `lodge` (string, optional)
- `roomNumber` (string, optional)
- `createdAt` (timestamp)

### Book Entity
- `id` (UUID)
- `title` (string)
- `author` (string)
- `price` (decimal)
- `category` (enum: 'Textbook' | 'Manual' | 'Guide' | 'Past Paper')
- `classFormLevel` (string, optional)
- `stock` (integer)
- `coverUrl` (string, optional)
- `createdById` (UUID, foreign key)
- `createdAt` (timestamp)

### Order Entity
- `id` (UUID)
- `studentId` (UUID, foreign key)
- `totalAmount` (decimal)
- `paymentStatus` (enum: 'paid' | 'pending' | 'failed')
- `orderStatus` (enum: 'processing' | 'purchased' | 'delivering' | 'delivered')
- `deliveryAddress` (text)
- `createdAt` (timestamp)

### OrderItem Entity
- `id` (UUID)
- `bookId` (UUID, foreign key)
- `orderId` (UUID, foreign key)
- `quantity` (integer)
- `price` (decimal)

## Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/
│   ├── database.ts        # TypeORM configuration
│   └── env.ts             # Environment variables
├── entities/
│   ├── User.ts
│   ├── Book.ts
│   ├── Order.ts
│   └── OrderItem.ts
├── repositories/
│   ├── user.repository.ts
│   ├── book.repository.ts
│   ├── order.repository.ts
│   └── orderItem.repository.ts
├── services/
│   ├── auth.service.ts
│   ├── book.service.ts
│   ├── order.service.ts
│   └── payment.service.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── book.controller.ts
│   ├── order.controller.ts
│   └── payment.controller.ts
├── routes/
│   ├── auth.routes.ts
│   ├── book.routes.ts
│   ├── order.routes.ts
│   ├── payment.routes.ts
│   └── admin.routes.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── admin.middleware.ts
│   └── error.middleware.ts
├── utils/
│   ├── jwt.ts
│   ├── validators.ts
│   └── response.ts
└── docs/
    └── swagger.ts
```

## Example Requests

### Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "student",
    "lodge": "Lodge A",
    "roomNumber": "101"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Book (Admin)
```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "title": "Mathematics Textbook",
    "author": "John Smith",
    "price": 50.00,
    "category": "Textbook",
    "classFormLevel": "Form 1",
    "stock": 100,
    "coverUrl": "https://example.com/cover.jpg"
  }'
```

### Create an Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student-token>" \
  -d '{
    "items": [
      {
        "bookId": "<book-uuid>",
        "quantity": 2
      }
    ],
    "deliveryAddress": "Lodge A, Room 101, University Campus"
  }'
```

## Deployment

### Recommended Platforms

- **Backend**: Railway / Render / Heroku
- **Database**: Neon.tech (PostgreSQL) / Supabase / Railway PostgreSQL

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `DATABASE_URL`
- `JWT_SECRET` (use a strong, random secret)
- `PAYMENT_SECRET`
- `PAYMENT_PUBLIC_KEY`
- `NODE_ENV=production`
- `PORT` (usually set by the platform)
- `CORS_ORIGIN` (your frontend URL)

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run typeorm` - Run TypeORM CLI commands

### Database Migrations

TypeORM is configured to synchronize schema in development mode. For production, use migrations:

```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

## Notes

- The payment service currently uses mock implementation. Integrate with your payment gateway (Paystack, Stripe, etc.) in production.
- Password hashing uses bcrypt with 10 rounds.
- JWT tokens expire in 7 days by default (configurable via `JWT_EXPIRES_IN`).
- All routes are documented in Swagger UI.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

ISC

