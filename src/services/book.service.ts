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

