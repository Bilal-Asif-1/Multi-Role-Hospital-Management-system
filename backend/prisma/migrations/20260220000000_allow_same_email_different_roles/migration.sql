-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_role_key" ON "users"("email", "role");
