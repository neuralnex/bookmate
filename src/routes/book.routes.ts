import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { uploadLimiter } from '../middleware/security.middleware';
import { upload } from '../utils/fileUpload';

const router = Router();
const bookController = new BookController();

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books with pagination, filtering, and sorting
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Textbook, Manual, Guide, Past Paper]
 *         description: Filter by book category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search books by title, author, or classFormLevel
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, title, createdAt, author]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Paginated list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Books retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Book'
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 */
router.get('/', bookController.getAllBooksPaginated);

// Keep old endpoint for backward compatibility
router.get('/all', bookController.getAllBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */
router.get('/:id', bookController.getBookById);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *               - category
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *                 example: Mathematics Textbook
 *               author:
 *                 type: string
 *                 example: John Smith
 *               price:
 *                 type: number
 *                 example: 5000.00
 *                 description: Price in Naira (NGN)
 *               category:
 *                 type: string
 *                 enum: [Textbook, Manual, Guide, Past Paper]
 *               classFormLevel:
 *                 type: string
 *                 example: Form 1
 *               stock:
 *                 type: integer
 *                 example: 100
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file (PNG, JPG, JPEG, GIF, WEBP) - max 100MB. Will be converted to base64 and stored.
 *     responses:
 *       201:
 *         description: Book created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authMiddleware, adminMiddleware, uploadLimiter, upload.single('coverImage'), bookController.createBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Price in Naira (NGN)
 *               category:
 *                 type: string
 *                 enum: [Textbook, Manual, Guide, Past Paper]
 *               stock:
 *                 type: integer
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file (PNG, JPG, JPEG, GIF, WEBP) - max 100MB. Will be converted to base64 and stored.
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 */
router.put('/:id', authMiddleware, adminMiddleware, uploadLimiter, upload.single('coverImage'), bookController.updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authMiddleware, adminMiddleware, bookController.deleteBook);

export default router;

