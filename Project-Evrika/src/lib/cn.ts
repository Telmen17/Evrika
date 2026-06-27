/**
 * cn — merge Tailwind class strings without conflicting utilities.
 *
 * Docs: docs/styles/tailwind.md
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
