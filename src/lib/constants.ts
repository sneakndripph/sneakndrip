/* ─── Brand Design Tokens — Design 1: Cream Culture ──────────────────────
   Extracted directly from the Sneak N' Drip logo:
   Teal  #5BB8B4  →  "DRIP" text
   Red   #D94F3D  →  glitch effect + Converse shoe
   Black #0D0D0D  →  thick sticker outline
   Cream #F2F0EF  →  logo text fill + specified BG
   ─────────────────────────────────────────────────────────────────────── */

export const BRAND = {
  bg: "#F2F0EF",
  card: "#FFFFFF",
  black: "#0D0D0D",
  teal: "#5BB8B4",
  red: "#D94F3D",
  muted: "#8A8580",
  mutedLight: "#B0ABA5",
  border: "rgba(13,13,13,0.09)",
  cardBorder: "rgba(13,13,13,0.07)",
  inputBg: "#F8F7F6",
} as const;

export const FONTS = {
  display: "var(--font-bebas), sans-serif",
  body: "var(--font-space-grotesk), sans-serif",
} as const;

export const SNEAKER_SIZES = [
  "US 4", "US 4.5", "US 5", "US 5.5",
  "US 6", "US 6.5", "US 7", "US 7.5",
  "US 8", "US 8.5", "US 9", "US 9.5",
  "US 10", "US 10.5", "US 11", "US 11.5",
  "US 12", "US 13",
];

export const BRANDS = [
  "Nike", "Jordan", "Adidas", "New Balance",
  "Puma", "ASICS", "Converse", "Vans",
  "Reebok", "Salomon", "On Running", "Hoka",
];

export const GENDERS = ["Men", "Women", "Unisex", "Kids"] as const;

export const ORDER_STATUSES = [
  "pending", "paid", "processing", "shipped", "delivered", "cancelled",
] as const;

export const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: "💙" },
  { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
] as const;

export const SHIPPING_FEE = {
  metro_manila: 150,
  provincial: 250,
  free_threshold: 3000,
} as const;

export const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Nike Air Force 1 '07 White",
    slug: "nike-air-force-1-07-white",
    brand: "Nike",
    colorway: "White / White",
    gender: "unisex",
    description: "The Nike Air Force 1 '07 is the OG that started it all. This low-top version maintains the classic look with premium leather and Air cushioning.",
    status: "on-hand" as const,
    srp_price: 6995,
    downpayment_price: 6490,
    full_payment_price: 5995,
    is_featured: true,
    is_trending: true,
    is_new: true,
    bg: "#F0EDE8",
    sizes: [
      { size: "US 7", stock: 2 }, { size: "US 7.5", stock: 1 },
      { size: "US 8", stock: 3 }, { size: "US 8.5", stock: 2 },
      { size: "US 9", stock: 1 }, { size: "US 9.5", stock: 0 },
      { size: "US 10", stock: 2 }, { size: "US 11", stock: 1 },
    ],
  },
  {
    id: "2",
    name: "Jordan 4 Retro Black Cat",
    slug: "jordan-4-retro-black-cat",
    brand: "Jordan",
    colorway: "Black / Black",
    gender: "unisex",
    description: "The Air Jordan 4 Retro 'Black Cat' returns in an all-black colorway. Featuring a stealthy matte black upper with visible Air unit.",
    status: "pre-order" as const,
    eta_start: "2025-07-15",
    eta_end: "2025-07-25",
    srp_price: 14995,
    downpayment_price: 13490,
    full_payment_price: 12495,
    is_featured: true,
    is_trending: true,
    is_new: true,
    bg: "#E8E4DE",
    sizes: [
      { size: "US 7", stock: 0 }, { size: "US 8", stock: 5 },
      { size: "US 8.5", stock: 3 }, { size: "US 9", stock: 4 },
      { size: "US 9.5", stock: 2 }, { size: "US 10", stock: 1 },
    ],
  },
  {
    id: "3",
    name: "Adidas Yeezy Slide Onyx",
    slug: "adidas-yeezy-slide-onyx",
    brand: "Adidas",
    colorway: "Onyx / Onyx",
    gender: "unisex",
    description: "The Yeezy Slide Onyx delivers a minimalist silhouette in a rich, dark colorway. Lightweight foam construction for all-day comfort.",
    status: "on-hand" as const,
    srp_price: 8990,
    downpayment_price: 7990,
    full_payment_price: 7490,
    is_featured: false,
    is_trending: true,
    is_new: true,
    bg: "#EDE9E3",
    sizes: [
      { size: "US 7", stock: 4 }, { size: "US 8", stock: 2 },
      { size: "US 9", stock: 3 }, { size: "US 10", stock: 5 },
      { size: "US 11", stock: 1 },
    ],
  },
  {
    id: "4",
    name: "New Balance 550 White Green",
    slug: "new-balance-550-white-green",
    brand: "New Balance",
    colorway: "White / Green",
    gender: "unisex",
    description: "The New Balance 550 is a retro basketball silhouette reimagined for today. Clean leather upper with a thick cupsole.",
    status: "on-hand" as const,
    srp_price: 7995,
    downpayment_price: 7495,
    full_payment_price: 6995,
    is_featured: false,
    is_trending: false,
    is_new: true,
    bg: "#EBE7E1",
    sizes: [
      { size: "US 7", stock: 1 }, { size: "US 7.5", stock: 3 },
      { size: "US 8", stock: 2 }, { size: "US 9", stock: 2 },
      { size: "US 9.5", stock: 4 }, { size: "US 10", stock: 1 },
    ],
  },
  {
    id: "5",
    name: "Nike Dunk Low Panda",
    slug: "nike-dunk-low-panda",
    brand: "Nike",
    colorway: "White / Black",
    gender: "unisex",
    description: "The Nike Dunk Low 'Panda' is one of the most iconic colorways of the silhouette. Classic two-tone leather upper.",
    status: "pre-order" as const,
    eta_start: "2025-08-01",
    eta_end: "2025-08-10",
    srp_price: 9995,
    downpayment_price: 9490,
    full_payment_price: 8995,
    is_featured: true,
    is_trending: true,
    is_new: false,
    bg: "#EEEaE4",
    sizes: [
      { size: "US 7", stock: 0 }, { size: "US 8", stock: 3 },
      { size: "US 9", stock: 5 }, { size: "US 10", stock: 4 },
      { size: "US 11", stock: 2 },
    ],
  },
  {
    id: "6",
    name: "Jordan 1 Retro High OG",
    slug: "jordan-1-retro-high-og",
    brand: "Jordan",
    colorway: "Chicago / Red",
    gender: "unisex",
    description: "The Air Jordan 1 Retro High OG returns in its iconic Chicago colorway. Premium leather upper with Nike Air cushioning.",
    status: "on-hand" as const,
    srp_price: 17995,
    downpayment_price: 16490,
    full_payment_price: 15995,
    is_featured: true,
    is_trending: false,
    is_new: false,
    bg: "#E8E4DE",
    sizes: [
      { size: "US 8", stock: 1 }, { size: "US 8.5", stock: 2 },
      { size: "US 9", stock: 1 }, { size: "US 9.5", stock: 3 },
      { size: "US 10", stock: 2 },
    ],
  },
  {
    id: "7",
    name: "Adidas Samba OG White",
    slug: "adidas-samba-og-white",
    brand: "Adidas",
    colorway: "White / Black / Gum",
    gender: "unisex",
    description: "The Adidas Samba OG is a timeless football-inspired sneaker. Low-profile silhouette with suede overlays.",
    status: "on-hand" as const,
    srp_price: 6490,
    downpayment_price: 5990,
    full_payment_price: 5490,
    is_featured: false,
    is_trending: true,
    is_new: true,
    bg: "#F2EFEA",
    sizes: [
      { size: "US 7", stock: 3 }, { size: "US 8", stock: 4 },
      { size: "US 9", stock: 2 }, { size: "US 10", stock: 1 },
    ],
  },
  {
    id: "8",
    name: "Nike SB Dunk Low Pro",
    slug: "nike-sb-dunk-low-pro",
    brand: "Nike",
    colorway: "University Blue",
    gender: "unisex",
    description: "The Nike SB Dunk Low Pro keeps the iconic Dunk profile with added skate-specific details for durability and performance.",
    status: "pre-order" as const,
    eta_start: "2025-09-01",
    eta_end: "2025-09-15",
    srp_price: 11995,
    downpayment_price: 10990,
    full_payment_price: 10495,
    is_featured: false,
    is_trending: false,
    is_new: true,
    bg: "#ECE9E4",
    sizes: [
      { size: "US 8", stock: 0 }, { size: "US 9", stock: 6 },
      { size: "US 10", stock: 4 }, { size: "US 11", stock: 3 },
    ],
  },
];

export const MOCK_REVIEWS = [
  { id: "1", author_name: "Marco R.", rating: 5, title: "Super fast delivery!", body: "Super legit ang pair! GCash payment went through agad. Delivered in 2 days, well-packaged. Will definitely order again!", is_verified: true, created_at: "2025-06-02" },
  { id: "2", author_name: "Issa T.", rating: 5, title: "Smooth pre-order experience", body: "Pre-order experience was smooth. ETA was accurate and they kept me updated throughout. 100% recommend Sneak N' Drip!", is_verified: true, created_at: "2025-05-28" },
  { id: "3", author_name: "Paulo C.", rating: 5, title: "3rd time ordering na!", body: "Third time ordering na! Every pair is authentic, legit check confirmed. Fast response sa DMs din.", is_verified: true, created_at: "2025-05-20" },
  { id: "4", author_name: "Karla M.", rating: 5, title: "Below SRP talaga!", body: "Sulit na sulit! Below SRP yung price nila kaya mas madali mapadala sa partner ko. Legit shop!", is_verified: true, created_at: "2025-05-15" },
  { id: "5", author_name: "Dio V.", rating: 5, title: "Downpayment system is so convenient", body: "Yung downpayment system is so convenient for pre-orders. Reserved my pair agad no hassle!", is_verified: false, created_at: "2025-05-10" },
  { id: "6", author_name: "Trisha L.", rating: 5, title: "My go-to shop na!", body: "Fast replies, authentic kicks, no issues. What more could you ask for? This is my go-to shop na!", is_verified: true, created_at: "2025-05-05" },
];
