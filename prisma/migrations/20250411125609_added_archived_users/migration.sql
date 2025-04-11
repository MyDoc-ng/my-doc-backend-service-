-- CreateTable
CREATE TABLE "archived_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedReason" TEXT,
    "originalRoles" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "archived_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archived_users_email_key" ON "archived_users"("email");
