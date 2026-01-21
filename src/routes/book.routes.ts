import { Router } from 'express';
import { BookController } from '../controllers/book.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { upload } from '../utils/fileUpload';

const router = Router();
const bookController = new BookController();

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/', bookController.getAllBooks);

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
router.post('/', authMiddleware, adminMiddleware, upload.single('coverImage'), bookController.createBook);

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
router.put('/:id', authMiddleware, adminMiddleware, upload.single('coverImage'), bookController.updateBook);

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

