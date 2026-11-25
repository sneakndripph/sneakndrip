import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ONE_SIZE } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function now(): number {
  return Date.now()
}

/** Bags and most accessories carry a single "One Size" stock row instead of a size run. */
export const isOneSize = (p: { sizes: { size: string }[] }) =>
  p.sizes.length === 1 && p.sizes[0].size === ONE_SIZE;

/**
 * Admin check for pre-order dates (YYYY-MM-DD). A past ETA end makes the item show as
 * Sold Out and blocks checkout, so catch typos like an end date before the start.
 */
export function etaError(start: string, end: string): string {
  if (start && end && end < start) return "ETA end must be on or after ETA start.";
  if (end && end < new Date().toLocaleDateString("en-CA")) return "ETA end is in the past, so this pre-order would show as Sold Out. Pick a future date.";
  return "";
}
