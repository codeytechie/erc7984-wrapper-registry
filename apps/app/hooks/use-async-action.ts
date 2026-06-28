import { useCallback, useState } from "react";
import { toast } from "sonner";
import { type AppError, toAppError } from "@/lib/errors";

type Status = "idle" | "pending" | "success" | "error";

export function useAsyncAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<R | null>(null);

  const run = useCallback(
    async (...args: A): Promise<R | null> => {
      setStatus("pending");
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        setStatus("success");
        return result;
      } catch (e) {
        const appErr = toAppError(e);
        setError(appErr);
        setStatus("error");
        toast.error(appErr.title, { description: appErr.message });
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setData(null);
  }, []);

  return { run, status, error, data, reset, isPending: status === "pending" };
}
