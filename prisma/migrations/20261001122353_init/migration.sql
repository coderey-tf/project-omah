-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('CASH', 'BANK', 'EWALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER');

-- CreateEnum
CREATE TYPE "BillPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "NotificationChannelType" AS ENUM ('TELEGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationEntity" AS ENUM ('BILL', 'REMINDER', 'BUDGET');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "households" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "period_start_day" SMALLINT NOT NULL DEFAULT 1,
    "ical_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "household_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "used_by_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WalletType" NOT NULL DEFAULT 'CASH',
    "opening_balance" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "icon" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "category_id" UUID,
    "wallet_id" UUID NOT NULL,
    "to_wallet_id" UUID,
    "occurred_on" DATE NOT NULL,
    "note" TEXT,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "limit_amount" BIGINT NOT NULL,
    "effective_from" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_bills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "period" "BillPeriod" NOT NULL DEFAULT 'MONTHLY',
    "due_day" SMALLINT NOT NULL,
    "due_month" SMALLINT,
    "remind_days_before" INTEGER[] DEFAULT ARRAY[3, 0]::INTEGER[],
    "last_paid_due_date" DATE,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "recurring_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" BIGINT NOT NULL,
    "saved_amount" BIGINT NOT NULL DEFAULT 0,
    "deadline" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "list_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_by_id" UUID,
    "checked_at" TIMESTAMPTZ(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "assignee_id" UUID,
    "due_date" DATE,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE',
    "done_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "recurrence" "Recurrence" NOT NULL DEFAULT 'NONE',
    "remind_days_before" INTEGER[] DEFAULT ARRAY[30, 7, 0]::INTEGER[],
    "note" TEXT,
    "done_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "address" TEXT,
    "link_code_hash" TEXT,
    "link_code_expires_at" TIMESTAMPTZ(3),
    "linked_at" TIMESTAMPTZ(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "channel" "NotificationChannelType" NOT NULL,
    "entity_type" "NotificationEntity" NOT NULL,
    "entity_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "slot" SMALLINT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "household_id" UUID NOT NULL,
    "actor_id" UUID,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "diff" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "households_ical_token_key" ON "households"("ical_token");

-- CreateIndex
CREATE INDEX "profiles_household_id_idx" ON "profiles"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_household_id_idx" ON "invitations"("household_id");

-- CreateIndex
CREATE INDEX "wallets_household_id_idx" ON "wallets"("household_id");

-- CreateIndex
CREATE INDEX "categories_household_id_idx" ON "categories"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_household_id_kind_name_key" ON "categories"("household_id", "kind", "name");

-- CreateIndex
CREATE INDEX "transactions_household_id_occurred_on_idx" ON "transactions"("household_id", "occurred_on" DESC);

-- CreateIndex
CREATE INDEX "transactions_household_id_category_id_occurred_on_idx" ON "transactions"("household_id", "category_id", "occurred_on");

-- CreateIndex
CREATE INDEX "transactions_wallet_id_idx" ON "transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "transactions_to_wallet_id_idx" ON "transactions"("to_wallet_id");

-- CreateIndex
CREATE INDEX "budgets_household_id_idx" ON "budgets"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_category_id_effective_from_key" ON "budgets"("category_id", "effective_from");

-- CreateIndex
CREATE INDEX "recurring_bills_household_id_idx" ON "recurring_bills"("household_id");

-- CreateIndex
CREATE INDEX "savings_goals_household_id_idx" ON "savings_goals"("household_id");

-- CreateIndex
CREATE INDEX "shopping_lists_household_id_idx" ON "shopping_lists"("household_id");

-- CreateIndex
CREATE INDEX "shopping_items_household_id_idx" ON "shopping_items"("household_id");

-- CreateIndex
CREATE INDEX "shopping_items_list_id_sort_order_idx" ON "shopping_items"("list_id", "sort_order");

-- CreateIndex
CREATE INDEX "tasks_household_id_done_at_idx" ON "tasks"("household_id", "done_at");

-- CreateIndex
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "reminders_household_id_due_date_idx" ON "reminders"("household_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_channels_link_code_hash_key" ON "notification_channels"("link_code_hash");

-- CreateIndex
CREATE UNIQUE INDEX "notification_channels_profile_id_channel_key" ON "notification_channels"("profile_id", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_household_id_created_at_idx" ON "notification_logs"("household_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_profile_id_channel_entity_type_entity_id__key" ON "notification_logs"("profile_id", "channel", "entity_type", "entity_id", "due_date", "slot");

-- CreateIndex
CREATE INDEX "audit_logs_household_id_created_at_idx" ON "audit_logs"("household_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_used_by_id_fkey" FOREIGN KEY ("used_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_wallet_id_fkey" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bills" ADD CONSTRAINT "recurring_bills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_checked_by_id_fkey" FOREIGN KEY ("checked_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_channels" ADD CONSTRAINT "notification_channels_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
