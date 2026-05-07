import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function padToThreeDigits(num: number): string {
  return num.toString().padStart(3, '0');
}