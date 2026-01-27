import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Book } from '../entities/Book';

export class BookRepository {
  private repository: Repository<Book>;

  constructor() {
    this.repository = AppDataSource.getRepository(Book);
  }

  async findAll(): Promise<Book[]> {
    return this.repository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Book | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  }

  async create(bookData: Partial<Book>): Promise<Book> {
    const book = this.repository.create(bookData);
    return this.repository.save(book);
  }

  async update(id: string, bookData: Partial<Book>): Promise<Book> {
    await this.repository.update(id, bookData);
    const updatedBook = await this.findById(id);
    if (!updatedBook) {
      throw new Error('Book not found');
    }
    return updatedBook;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async decrementStock(id: string, quantity: number): Promise<void> {
    const book = await this.findById(id);
    if (!book) {
      throw new Error('Book not found');
    }
    if (book.stock < quantity) {
      throw new Error(`Insufficient stock for book: ${book.title}`);
    }
    await this.repository.update(id, { stock: book.stock - quantity });
  }

  async findByIds(ids: string[]): Promise<Book[]> {
    if (ids.length === 0) return [];
    return this.repository.find({
      where: ids.map((id) => ({ id })),
    });
  }
}

