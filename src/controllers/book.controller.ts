import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/book.service';
import { sendSuccess, sendError } from '../utils/response';
import { createBookSchema, updateBookSchema } from '../utils/validators';
import { fileToBase64 } from '../utils/fileUpload';

export class BookController {
  private bookService: BookService;

  constructor() {
    this.bookService = new BookService();
  }

  getAllBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const books = await this.bookService.getAllBooks();
      sendSuccess(res, books, 'Books retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const book = await this.bookService.getBookById(id);
      sendSuccess(res, book, 'Book retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      // Handle file upload if present
      let coverImage: string | undefined;
      if (req.file) {
        coverImage = fileToBase64(req.file);
      } else if (req.body.coverImage) {
        // Allow direct base64 input as fallback
        coverImage = req.body.coverImage;
      }

      // Parse and validate other fields
      const bookData = {
        title: req.body.title,
        author: req.body.author,
        price: parseFloat(req.body.price),
        category: req.body.category,
        classFormLevel: req.body.classFormLevel,
        stock: parseInt(req.body.stock),
        coverImage,
      };

      const validatedData = createBookSchema.parse(bookData);
      const book = await this.bookService.createBook({
        ...validatedData,
        createdById: req.user.userId,
      });
      sendSuccess(res, book, 'Book created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Handle file upload if present
      let coverImage: string | undefined;
      if (req.file) {
        coverImage = fileToBase64(req.file);
      } else if (req.body.coverImage) {
        coverImage = req.body.coverImage;
      }

      // Build update data
      const updateData: any = {};
      if (req.body.title) updateData.title = req.body.title;
      if (req.body.author) updateData.author = req.body.author;
      if (req.body.price) updateData.price = parseFloat(req.body.price);
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.classFormLevel !== undefined) updateData.classFormLevel = req.body.classFormLevel;
      if (req.body.stock !== undefined) updateData.stock = parseInt(req.body.stock);
      if (coverImage !== undefined) updateData.coverImage = coverImage;

      const validatedData = updateBookSchema.parse(updateData);
      const book = await this.bookService.updateBook(id, validatedData);
      sendSuccess(res, book, 'Book updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.bookService.deleteBook(id);
      sendSuccess(res, null, 'Book deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

