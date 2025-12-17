-- Add user_id column
ALTER TABLE "feelings" ADD COLUMN "user_id" UUID;

-- Copy user_id from related user_books
UPDATE "feelings" f
SET "user_id" = ub."user_id"
FROM "user_books" ub
WHERE f."user_book_id" = ub."id";

-- Make user_id required
ALTER TABLE "feelings" ALTER COLUMN "user_id" SET NOT NULL;

-- Add foreign key to users
ALTER TABLE "feelings"
ADD CONSTRAINT "feelings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
