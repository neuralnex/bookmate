import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrdersMonnifyTransactionReference1749123000000 implements MigrationInterface {
  name = 'OrdersMonnifyTransactionReference1749123000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /** Fresh DBs run migrations before synchronize; `orders` may not exist yet — TypeORM will create the column from the entity. */
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'orders'
        ) THEN
          ALTER TABLE "orders"
          ADD COLUMN IF NOT EXISTS "monnify_transaction_reference" character varying(255);

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'opayOrderNo'
          ) THEN
            UPDATE "orders"
            SET "monnify_transaction_reference" = COALESCE(
              "monnify_transaction_reference",
              "opayOrderNo"::varchar
            )
            WHERE "opayOrderNo" IS NOT NULL;
            ALTER TABLE "orders" DROP COLUMN "opayOrderNo";
          END IF;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'orders'
        ) THEN
          ALTER TABLE "orders"
          ADD COLUMN IF NOT EXISTS "opayOrderNo" character varying(255);
          UPDATE "orders" SET "opayOrderNo" = "monnify_transaction_reference"
          WHERE "opayOrderNo" IS NULL AND "monnify_transaction_reference" IS NOT NULL;
          ALTER TABLE "orders" DROP COLUMN IF EXISTS "monnify_transaction_reference";
        END IF;
      END $$;
    `);
  }
}
