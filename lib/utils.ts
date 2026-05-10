import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}
