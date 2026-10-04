// Client-safe enums and types matching Prisma schema definitions.
// Using `as const` objects instead of TypeScript `enum` ensures structural compatibility
// with Prisma's generated string unions and prevents bundling @prisma/client in browser components.

export const MemberRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const WalletType = {
  CASH: "CASH",
  BANK: "BANK",
  EWALLET: "EWALLET",
  OTHER: "OTHER",
} as const;
export type WalletType = (typeof WalletType)[keyof typeof WalletType];

export const CategoryKind = {
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
} as const;
export type CategoryKind = (typeof CategoryKind)[keyof typeof CategoryKind];

export const TransactionType = {
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
  TRANSFER: "TRANSFER",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const BillPeriod = {
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type BillPeriod = (typeof BillPeriod)[keyof typeof BillPeriod];

export const Recurrence = {
  NONE: "NONE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
} as const;
export type Recurrence = (typeof Recurrence)[keyof typeof Recurrence];

export const NotificationChannelType = {
  TELEGRAM: "TELEGRAM",
  WHATSAPP: "WHATSAPP",
} as const;
export type NotificationChannelType = (typeof NotificationChannelType)[keyof typeof NotificationChannelType];

export const NotificationEntity = {
  BILL: "BILL",
  REMINDER: "REMINDER",
  BUDGET: "BUDGET",
} as const;
export type NotificationEntity = (typeof NotificationEntity)[keyof typeof NotificationEntity];

export const NotificationStatus = {
  SENT: "SENT",
  FAILED: "FAILED",
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const DocumentCategory = {
  IDENTITY: "IDENTITY",
  PROPERTY: "PROPERTY",
  VEHICLE: "VEHICLE",
  INSURANCE: "INSURANCE",
  WARRANTY: "WARRANTY",
  OTHER: "OTHER",
} as const;
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const AssetType = {
  VEHICLE_CAR: "VEHICLE_CAR",
  VEHICLE_MOTORCYCLE: "VEHICLE_MOTORCYCLE",
  ELECTRONIC: "ELECTRONIC",
  HOME_APPLIANCE: "HOME_APPLIANCE",
  JEWELRY_VALUABLE: "JEWELRY_VALUABLE",
  OTHER: "OTHER",
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const KondanganType = {
  RECEIVED: "RECEIVED",
  GIVEN: "GIVEN",
} as const;
export type KondanganType = (typeof KondanganType)[keyof typeof KondanganType];

export const MealSlot = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
  SNACK: "SNACK",
} as const;
export type MealSlot = (typeof MealSlot)[keyof typeof MealSlot];
