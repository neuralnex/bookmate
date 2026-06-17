import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1700000000000 implements MigrationInterface {
  name = 'AddIndexes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes for Books table
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_category ON books(category)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_price ON books(price)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_stock ON books(stock)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(createdAt)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(createdById)`);

    // Add indexes for Orders table
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_student_id ON orders(studentId)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(paymentStatus)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(orderStatus)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(deliveryMethod)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdAt)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(totalAmount)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(paymentReference)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_monnify_transaction_reference ON orders(monnify_transaction_reference)`);

    // Add indexes for Users table
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_reg_number ON users(regNumber)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(createdAt)`);

    // Add indexes for OrderItems table
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(bookId)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(orderId)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(createdAt)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes for Books table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_category`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_author`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_title`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_price`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_stock`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_books_created_by`);

    // Drop indexes for Orders table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_student_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_payment_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_order_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_delivery_method`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_total_amount`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_payment_reference`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_monnify_transaction_reference`);

    // Drop indexes for Users table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_reg_number`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at`);

    // Drop indexes for OrderItems table
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_book_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_order_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_created_at`);
  }
}
