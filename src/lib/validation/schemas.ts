import { z } from "zod";

/** Standard email address, capped at 254 chars (RFC 5321 max envelope length). */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Invalid email address");

/** PH mobile number — accepts local (09XXXXXXXXX) or international (+639XXXXXXXXX) format. */
export const mobileSchema = z
  .string()
  .trim()
  .regex(/^(09\d{9}|\+639\d{9})$/, "Invalid mobile number");

/** RFC 4122 UUID, used for row ids across the app. */
export const uuidSchema = z.string().uuid("Invalid id");

/** Order number as generated at checkout: "SND-" followed by 8 digits. */
export const orderNumberSchema = z
  .string()
  .trim()
  .regex(/^SND-\d{8}$/, "Invalid order number");

/** 4-digit PH postal code. */
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Invalid postal code");

/** Non-negative price/amount, in the store's base currency unit. */
export const priceSchema = z
  .number()
  .finite("Invalid price")
  .nonnegative("Price cannot be negative");

/** Positive integer quantity (e.g. cart/order line items). */
export const quantitySchema = z
  .number()
  .int("Quantity must be a whole number")
  .positive("Quantity must be at least 1");

/** Common page/limit pagination params, coerced from query-string strings. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
