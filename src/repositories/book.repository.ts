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

  async findAllPaginated(
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
  ): Promise<{ books: Book[]; total: number }> {
    const { category, search, minPrice, maxPrice, inStock, sortBy = 'createdAt', sortOrder = 'DESC' } = options;
    
    const queryBuilder = this.repository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.createdBy', 'createdBy')
      .where('book.id IS NOT NULL'); // Base condition

    // Filter by category
    if (category) {
      queryBuilder.andWhere('book.category = :category', { category });
    }

    // Filter by search term (title, author, classFormLevel)
    if (search) {
      queryBuilder.andWhere(
        '(book.title ILIKE :search OR book.author ILIKE :search OR book.classFormLevel ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('book.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('book.price <= :maxPrice', { maxPrice });
    }

    // Filter by stock
    if (inStock !== undefined) {
      queryBuilder.andWhere('book.stock :operator 0', {
        operator: inStock ? '>' : '<=',
      });
    }

    // Sort
    const validSortColumns: Record<string, string> = {
      price: 'book.price',
      title: 'book.title',
      createdAt: 'book.createdAt',
      author: 'book.author',
    };
    const sortField = validSortColumns[sortBy] || 'book.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);

    // Pagination
    const [books, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { books, total };
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

