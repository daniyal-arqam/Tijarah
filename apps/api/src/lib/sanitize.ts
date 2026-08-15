import { z } from "zod";

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
}

export const safeText = (max = 4000) => z.string().min(1).max(max).transform(stripHtml);
