import { z } from "zod";
import { isAddress } from "viem";
import { parseAmount } from "./format";

// a valid 0x ethereum address
export const addressSchema = z
  .string()
  .trim()
  .refine((v) => isAddress(v), { message: "Enter a valid Ethereum address" })
  .transform((v) => v as `0x${string}`);

// amount string to bigint base units
export function amountSchema(decimals: number, max?: bigint) {
  return z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      if (!v) {
        ctx.addIssue({ code: "custom", message: "Enter an amount" });
        return;
      }
      if (!/^\d*\.?\d*$/.test(v) || !/\d/.test(v)) {
        ctx.addIssue({ code: "custom", message: "Enter a valid number" });
        return;
      }
      if ((v.split(".")[1] ?? "").length > decimals) {
        ctx.addIssue({ code: "custom", message: `Up to ${decimals} decimal places` });
        return;
      }
      const base = parseAmount(v, decimals);
      if (base == null || base <= 0n) {
        ctx.addIssue({ code: "custom", message: "Amount must be greater than 0" });
        return;
      }
      if (max != null && base > max) {
        ctx.addIssue({ code: "custom", message: "Exceeds available balance" });
      }
    })
    .transform((v) => parseAmount(v, decimals) as bigint);
}

export interface FieldResult<T> {
  value: T | null;
  error: string | null;
}

// safe-parse to {value,error}; empty input shows no error
export function parseField<T>(schema: z.ZodType<T>, raw: string): FieldResult<T> {
  const res = schema.safeParse(raw);
  if (res.success) return { value: res.data, error: null };
  const first = res.error.issues[0]?.message ?? "Invalid input";
  return { value: null, error: raw.trim() === "" ? null : first };
}
