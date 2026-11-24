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
