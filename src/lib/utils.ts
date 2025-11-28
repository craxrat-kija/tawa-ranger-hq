import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if user has admin or super admin privileges
 */
export function isAdminOrSuperAdmin(role?: string): boolean {
  return role === "admin" || role === "super_admin";
}