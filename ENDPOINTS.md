# FUBOOKS API Endpoints

Complete list of all API endpoints with their methods, authentication requirements, and descriptions.

## Base URL
- Development: `http://localhost:3000`
- Production: Set via `API_URL` environment variable

## Public Endpoints

### Health Check
- **GET** `/health` - API health check
  - No authentication required
  - Returns: `{ status: 'ok', message: 'FUBOOKS API is running' }`

### API Documentation
- **GET** `/api-docs` - Swagger UI documentation
  - No authentication required
  - Interactive API documentation

## Authentication Endpoints

### Register
- **POST** `/auth/register` - Register a new user
  - No authentication required
  - Body: `{ name, email, regNumber, password, accommodation }`
  - Returns: User object and JWT token

### Login
- **POST** `/auth/login` - Login user
  - No authentication required
  - Body: `{ emailOrRegNumber, password }`
  - Returns: User object and JWT token

## Book Endpoints

### Get All Books
- **GET** `/books` - Get all books
  - No authentication required
  - Returns: Array of books

### Get Book by ID
- **GET** `/books/:id` - Get book by ID
  - No authentication required
  - Returns: Book object

### Create Book (Admin Only)
- **POST** `/books` - Create a new book
  - Authentication: Required (Bearer token)
  - Authorization: Admin only
  - Content-Type: `multipart/form-data`
  - Body: `{ title, author, price, category, stock, classFormLevel?, coverImage? }`
  - Returns: Created book object

### Update Book (Admin Only)
- **PUT** `/books/:id` - Update a book
  - Authentication: Required (Bearer token)
  - Authorization: Admin only
  - Content-Type: `multipart/form-data`
  - Body: `{ title?, author?, price?, category?, stock?, classFormLevel?, coverImage? }`
  - Returns: Updated book object

### Delete Book (Admin Only)
- **DELETE** `/books/:id` - Delete a book
  - Authentication: Required (Bearer token)
  - Authorization: Admin only
  - Returns: Success message

## Order Endpoints

### Create Order
- **POST** `/orders` - Create a new order
  - Authentication: Required (Bearer token)
  - Body: `{ items: [{ bookId, quantity }], deliveryAddress }`
  - Returns: Created order object

### Get My Orders
- **GET** `/orders` - Get user's orders
  - Authentication: Required (Bearer token)
  - Returns: Array of user's orders

### Get Order by ID
- **GET** `/orders/:id` - Get order by ID
  - Authentication: Required (Bearer token)
  - Returns: Order object (if user owns it or is admin)

## Payment Endpoints

### Initiate Payment
- **POST** `/payments/initiate` - Initiate OPay payment
  - Authentication: Required (Bearer token)
  - Body: `{ orderId, payMethod, ...methodSpecificFields }`
  - Returns: Payment details

### Initiate Cashier Payment
- **POST** `/payments/initiate-cashier` - Initiate OPay Cashier (Express Checkout)
  - Authentication: Required (Bearer token)
  - Body: `{ orderId }`
  - Returns: `{ reference, cashierUrl }` - Redirect user to cashierUrl

### Payment Callback (Webhook)
- **POST** `/payments/callback` - OPay payment callback/webhook
  - No authentication required (OPay calls this)
  - Body: OPay callback format
  - Returns: Success response

### Payment Return URL
- **GET** `/payments/return` - Handle payment return redirect
  - No authentication required
  - Query params: `reference`, `status`
  - Returns: Payment status

### Query Payment Status
- **GET** `/payments/status/:reference` - Query payment status
  - No authentication required
  - Returns: Payment status object

### Cancel Payment
- **POST** `/payments/cancel` - Cancel a payment
  - Authentication: Required (Bearer token)
  - Body: `{ reference }`
  - Returns: Success message

### Verify Payment
- **POST** `/payments/verify` - Verify payment
  - No authentication required
  - Body: `{ orderId, paymentReference, status }`
  - Returns: Success message

## Admin Endpoints

### Get All Orders (Admin Only)
- **GET** `/admin/orders` - Get all orders
  - Authentication: Required (Bearer token)
  - Authorization: Admin only
  - Returns: Array of all orders

### Update Order Status (Admin Only)
- **PUT** `/admin/orders/:id/status` - Update order status
  - Authentication: Required (Bearer token)
  - Authorization: Admin only
  - Body: `{ orderStatus: 'processing' | 'purchased' | 'delivering' | 'delivered' }`
  - Returns: Updated order object

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Get a token by logging in at `/auth/login` or registering at `/auth/register`.

## Rate Limiting

- **Auth endpoints**: 5 requests per 15 minutes
- **Payment endpoints**: 10 requests per 15 minutes
- **File uploads**: 20 uploads per hour
- **All other endpoints**: 100 requests per 15 minutes (production) or 1000 (development)

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

## Success Responses

All success responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

