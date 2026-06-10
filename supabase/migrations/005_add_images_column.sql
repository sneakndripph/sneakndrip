-- Add images array column to products table
-- Run this in Supabase SQL Editor if products are not appearing in the shop

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
