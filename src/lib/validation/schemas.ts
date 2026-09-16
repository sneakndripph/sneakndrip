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

/** Per-size stock entry, used in admin product create/update payloads. */
export const productSizeSchema = z.object({
  size: z.string().trim().min(1, "Missing size"),
  stock: z.number().int("Stock must be a whole number").nonnegative("Stock cannot be negative"),
});

/**
 * Shared field shape for the admin product form (src/app/admin/products/new/page.tsx)
 * and the scheduled-discount editor (src/app/admin/coupons/page.tsx), which PATCHes
 * only a subset of these fields (e.g. sale_price/sale_start/sale_end).
 */
const productFieldsShape = {
  name: z.string().trim().min(1, "Missing product name"),
  slug: z.string().trim().min(1, "Missing product slug"),
  brand: z.string().trim().min(1, "Missing product brand"),
  colorway: z.string().trim().nullable().optional(),
  sku: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  gender: z.enum(["Unisex", "Men", "Women", "Kids"], { error: "Invalid gender" }).optional(),
  status: z.enum(["on-hand", "pre-order", "sold-out"], { error: "Invalid status" }),
  eta_start: z.string().nullable().optional(),
  eta_end: z.string().nullable().optional(),
  srp_price: priceSchema,
  downpayment_price: priceSchema.nullable().optional(),
  full_payment_price: priceSchema,
  cost_price: priceSchema.nullable().optional(),
  bg: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  is_trending: z.boolean().optional(),
  is_new: z.boolean().optional(),
  is_published: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  sale_price: priceSchema.nullable().optional(),
  sale_start: z.string().nullable().optional(),
  sale_end: z.string().nullable().optional(),
};

/** Full product payload for admin create (POST /api/admin/products). Unknown keys are stripped. */
export const productCreateSchema = z.object(productFieldsShape);

/**
 * Partial product payload for admin update (PATCH /api/admin/products/[id]) — every
 * field optional since callers may send only a subset. Unknown keys (id, created_at,
 * updated_at, product_sizes, etc.) are stripped rather than reaching the DB update.
 */
export const productUpdateSchema = z.object(productFieldsShape).partial();
