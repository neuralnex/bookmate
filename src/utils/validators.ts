import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  regNumber: z.string().length(11, 'Registration number must be exactly 11 digits').regex(/^\d+$/, 'Registration number must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'admin']).optional().default('student'),
  accommodation: z.string().optional().describe('Full accommodation address (e.g., Lodge A, Room 101, University Campus)'),
});

export const loginSchema = z.object({
  emailOrRegNumber: z.string().min(1, 'Email or registration number is required'),
  password: z.string().min(1, 'Password is required'),
});

// Base64 image validation helper (for direct base64 input - optional)
const base64ImageSchema = z.string().refine(
  (val) => {
    if (!val) return true; // Optional field
    // Check if it's a valid base64 image string
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    return base64Regex.test(val) || val.startsWith('data:image/');
  },
  {
    message: 'Cover image must be a valid base64 encoded image (data:image/...)',
  }
);

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  price: z.number().positive('Price must be positive').describe('Price in Naira (NGN)'),
  category: z.enum(['Textbook', 'Manual', 'Guide', 'Past Paper']),
  classFormLevel: z.string().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  coverImage: base64ImageSchema.optional().describe('Base64 encoded image (optional if file upload is used)'),
});

export const updateBookSchema = createBookSchema.partial();

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.string().uuid('Invalid book ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters'),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['processing', 'purchased', 'delivering', 'delivered']),
});

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  payMethod: z.enum(['BankCard', 'BankTransfer', 'BankUssd', 'BankAccount', 'ReferenceCode', 'OpayWalletNgQR']),
  // BankCard specific
  bankcard: z.object({
    cardHolderName: z.string().min(1),
    cardNumber: z.string().min(13).max(19),
    cvv: z.string().length(3),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(2),
  }).optional(),
  // BankUssd specific
  bankCode: z.string().optional(),
  // BankAccount specific
  bankAccountNumber: z.string().optional(),
  bvn: z.string().optional(),
  dobDay: z.string().optional(),
  dobMonth: z.string().optional(),
  dobYear: z.string().optional(),
  // User info
  userPhone: z.string().optional(),
  customerName: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentReference: z.string().min(1, 'Payment reference is required'),
  status: z.enum(['success', 'failed']),
});

