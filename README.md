# Sneak N' Drip

Premium sneaker ecommerce for the Philippine market. Built with Next.js 15, Supabase, and Tailwind CSS.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database + Auth | Supabase |
| Storage | Supabase Storage |
| State (Cart) | Zustand + localStorage persist |
| Fonts | Bebas Neue, Space Grotesk (Google Fonts) |
| Deployment | Vercel |

---

## Local Development

### 1. Clone & install

```bash
git clone https://github.com/your-org/sneakndrip.git
cd sneakndrip
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_schema.sql`
3. Then run `supabase/seed.sql` to populate sample data
4. Go to **Authentication > URL Configuration** and set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### 4. Run dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, new arrivals, pre-order banner, reviews |
| `/shop` | Product listing with filters |
| `/shop/[slug]` | Product detail — gallery, size selector, add to cart |
| `/cart` | Cart with order summary |
| `/checkout` | 3-step checkout (details > payment > confirm) |
| `/account` | Customer dashboard (orders, addresses, profile) |
| `/login` | Sign in |
| `/register` | Create account |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/products/new` | Add new product |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer list |
| `/admin/settings` | Store settings |

---

## Database Schema

Tables: `products`, `product_images`, `product_sizes`, `orders`, `order_items`, `customers`, `shipping_addresses`, `reviews`

Key features:
- Per-size stock tracking via `product_sizes`
- Pre-order + downpayment system via `payment_type` (full/downpayment)
- Proof of payment upload to Supabase Storage
- Auto-create customer profile on signup via DB trigger
- Row Level Security — customers only see their own data

---

## Supabase Storage Buckets

| Bucket | Access | Purpose |
|---|---|---|
| `product-images` | Public | Sneaker product photos |
| `payment-proofs` | Private | GCash/Maya/bank transfer screenshots |

---

## Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add environment variables from `.env.example`
4. After deploy, update Supabase Authentication > URL Configuration with your production URL

---

## Admin Access

1. Sign up at `/register`
2. In Supabase Dashboard, set user metadata: `{ "role": "admin" }`

Or via SQL:
```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'
where email = 'admin@sneakndrip.ph';
```

---

## Customization

Brand colors in `src/lib/constants.ts`:

```ts
export const BRAND = {
  bg: "#F2F0EF",      // cream background
  teal: "#5BB8B4",    // primary accent
  red: "#D94F3D",     // secondary accent
  black: "#0D0D0D",   // text/headings
};
```

Payment account details in `src/app/(store)/checkout/page.tsx` — update `PAYMENT_DETAILS` with your actual GCash/Maya/bank info.

---

## Note on Mock Data

All pages work without Supabase credentials using mock data from `src/lib/constants.ts` (`MOCK_PRODUCTS`, `MOCK_REVIEWS`). To wire up live data, replace the mock data with Supabase client calls using `src/lib/supabase/client.ts` or `server.ts`.

---

Private — Sneak N' Drip, Philippines.
