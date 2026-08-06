type ClassValue = string | false | null | undefined;

/** Concatena classes ignorant els valors falsy. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
