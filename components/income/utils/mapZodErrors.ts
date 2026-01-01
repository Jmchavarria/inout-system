// income/utils/mapZodErrors.ts
import { ZodError } from 'zod';

export function mapZodErrors<T>(
  error: ZodError
): Partial<Record<keyof T, string>> {
  const result: Partial<Record<keyof T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key) result[key as keyof T] = issue.message;
  }
  return result;
}
