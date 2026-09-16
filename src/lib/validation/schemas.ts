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

/**
 * Legitimate order lifecycle values — mirrors the orders.status CHECK constraint
 * (supabase/migrations/026_arrived_ph_status.sql) and the admin UI's STATUSES list
 * (src/components/admin/OrderStatusBadge.tsx). Deliberately excludes "returned",
 * which returns/route.ts writes to orders.status on return approval but which is
 * NOT in the DB constraint — a pre-existing bug outside this schema's scope.
 */
export const orderStatusSchema = z.enum(
  ["pending", "paid", "processing", "stock_on_hand", "shipped", "delivered", "cancelled"],
  { error: "Invalid status" }
);

/** Full product payload for admin create (POST /api/admin/products). Unknown keys are stripped. */
export const productCreateSchema = z.object(productFieldsShape);

/**
 * Partial product payload for admin update (PATCH /api/admin/products/[id]) — every
 * field optional since callers may send only a subset. Unknown keys (id, created_at,
 * updated_at, product_sizes, etc.) are stripped rather than reaching the DB update.
 */
export const productUpdateSchema = z.object(productFieldsShape).partial();

/**
 * Shared field shape for admin coupon create/update (src/app/admin/coupons/page.tsx).
 * The coupon form sends value/min_order/max_uses as strings (raw <input> values), so
 * these coerce from string; empty-string sentinels are preprocessed to match the
 * routes' pre-existing "" -> 0/null behavior instead of failing type coercion.
 */
const couponFieldsShape = {
  code: z.string().trim().min(1, "Missing coupon code").transform(v => v.toUpperCase()),
  type: z.enum(["percent", "fixed"], { error: "Invalid coupon type" }),
  value: z.coerce.number().finite("Invalid value").nonnegative("Invalid value"),
  min_order: z.preprocess(
    v => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().finite("Invalid min order").nonnegative("Invalid min order")
  ),
  max_uses: z.preprocess(
    v => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int("Invalid max uses").positive("Invalid max uses").nullable()
  ),
  expires_at: z.preprocess(
    v => (v === "" || v === undefined ? null : v),
    z.string().nullable()
  ),
  is_active: z.boolean().optional(),
};

/** Full coupon payload for admin create (POST /api/admin/coupons). */
export const couponCreateSchema = z.object(couponFieldsShape);

/**
 * Partial coupon payload for admin update (PATCH /api/admin/coupons/[id]) — every
 * field optional since callers may send just one (e.g. { is_active } toggles).
 * Unknown keys are stripped, closing the previous `{ ...body }` mass-assignment gap.
 */
export const couponUpdateSchema = z.object(couponFieldsShape).partial();

/** Admin content-page editor payload (PATCH /api/admin/content/[slug]). */
export const contentUpdateSchema = z.object({
  content: z.string(),
});

/**
 * Store settings key/value map (POST /api/admin/settings) — a generic settings
 * store, so keys are open-ended; values are restricted to scalars (the route
 * stringifies each with String(value) before storage, so nested objects/arrays
 * would previously have silently become "[object Object]"/"a,b,c" strings).
 */
export const settingsUpdateSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean(), z.null()])
);

/** Ban/unban payload (PATCH /api/admin/customers). */
export const customerBanSchema = z.object({
  userId: uuidSchema,
  ban: z.boolean().optional(),
});

/** Valid app roles — mirrors ROLES in src/app/admin/users/page.tsx. */
export const roleSchema = z.enum(["customer", "admin"], { error: "Invalid role" });

/** Admin-created user account (POST /api/admin/users). */
export const userCreateSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Email and password required"),
  full_name: z.string().trim().optional(),
  role: roleSchema.optional(),
});

/** Admin user update (PATCH /api/admin/users) — role changes require re-auth via `password`, checked separately. */
export const userUpdateSchema = z.object({
  id: uuidSchema,
  role: roleSchema.optional(),
  full_name: z.string().trim().optional(),
  password: z.string().optional(),
});

/** Admin user delete (DELETE /api/admin/users). */
export const userDeleteSchema = z.object({
  id: uuidSchema,
});

/** Review moderation payload (PATCH /api/admin/reviews/[id]). */
export const reviewModerationSchema = z.object({
  is_verified: z.boolean(),
});

/** Review rejection reason (DELETE /api/admin/reviews/[id]) — optional, body is always sent as `{}` or `{reason}`. */
export const reviewDeleteSchema = z.object({
  reason: z.string().trim().optional(),
});
