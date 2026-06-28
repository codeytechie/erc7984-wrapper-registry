"use client";
import { Button } from "@/components/ui/button";
import { toAppError } from "@/lib/errors";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const e = toAppError(error);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-12 text-center">
      <h2 className="text-lg font-semibold">{e.title}</h2>
      <p className="text-sm text-muted-foreground">{e.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
