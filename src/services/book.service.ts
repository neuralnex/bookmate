import { BookRepository } from '../repositories/book.repository';
import { Book } from '../entities/Book';

export class BookService {
  private bookRepository: BookRepository;

  constructor() {
    this.bookRepository = new BookRepository();
  }

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.findAll();
  }

  async getAllBooksSimple(): Promise<Book[]> {
    // For mobile app - returns books without relations to avoid type mismatches
    return this.bookRepository.findAllWithoutRelations();
  }

  async getAllBooksPaginated(
    page: number = 1,
    limit: number = 20,
    options: {
      category?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      sortBy?: 'price' | 'title' | 'createdAt' | 'author';
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ): Promise<{ books: Book[]; total: number; page: number; limit: number; totalPages: number }> {
    // Validate pagination parameters
    page = Math.max(1, Math.floor(page));
    limit = Math.min(100, Math.max(1, Math.floor(limit))); // Max 100 per page

    const { books, total } = await this.bookRepository.findAllPaginated(page, limit, options);
    const totalPages = Math.ceil(total / limit);

    return {
      books,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getBookById(id: string): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new Error('Book not found');
    }
    return book;
  }

  async createBook(bookData: {
    title: string;
    author: string;
    price: number;
    category: 'Textbook' | 'Manual' | 'Guide' | 'Past Paper';
    classFormLevel?: string;
    stock: number;
    coverImage?: string; // Base64 encoded image
    createdById: string;
  }): Promise<Book> {
    return this.bookRepository.create(bookData);
  }

  async updateBook(id: string, bookData: Partial<Book>): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new Error('Book not found');
    }
    return this.bookRepository.update(id, bookData);
  }

  async deleteBook(id: string): Promise<void> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new Error('Book not found');
    }
    await this.bookRepository.delete(id);
  }
}

