-- Add a temporary BIGSERIAL column
ALTER TABLE "feelings" ADD COLUMN "new_id" BIGSERIAL;

-- Populate the new column for existing rows
UPDATE "feelings"
SET "new_id" = nextval(pg_get_serial_sequence('\"feelings\"', 'new_id'))
WHERE "new_id" IS NULL;

-- Switch primary key from the old UUID column to the new integer column
ALTER TABLE "feelings" DROP CONSTRAINT "feelings_pkey";
ALTER TABLE "feelings" DROP COLUMN "id";
ALTER TABLE "feelings" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "feelings" ADD CONSTRAINT "feelings_pkey" PRIMARY KEY ("id");
