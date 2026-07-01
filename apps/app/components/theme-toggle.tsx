"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = theme !== "light";

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && !isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
