-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('reading', 'done', 'paused', 'wish');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "login_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "page_count" INTEGER,
    "cover_url" TEXT,
    "status" "ReadingStatus" NOT NULL DEFAULT 'reading',
    "current_page" INTEGER NOT NULL DEFAULT 0,
    "progress_pct" SMALLINT NOT NULL DEFAULT 0,
    "goal_date" DATE,
    "started_at" DATE,
    "finished_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_book_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "current_page" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feelings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_book_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "page_number" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feelings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_id_key" ON "users"("login_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_books_user_id_external_id_key" ON "user_books"("user_id", "external_id");

-- CreateIndex
CREATE INDEX "reading_entries_user_book_id_entry_date_idx" ON "reading_entries"("user_book_id", "entry_date");

-- CreateIndex
CREATE INDEX "feelings_user_book_id_recorded_at_idx" ON "feelings"("user_book_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_entries" ADD CONSTRAINT "reading_entries_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feelings" ADD CONSTRAINT "feelings_user_book_id_fkey" FOREIGN KEY ("user_book_id") REFERENCES "user_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
