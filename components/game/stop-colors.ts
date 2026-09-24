import type { StopColor } from "./board-config"

/**
 * Tailwind's JIT scanner needs literal class names, so every "color token
 * to className" lookup used across the game overlay lives here as static
 * maps instead of being built with template strings at render time.
 */

export const STOP_BG_CLASS: Record<StopColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  chart5: "bg-chart5",
  destructive: "bg-destructive",
}

export const STOP_TEXT_CLASS: Record<StopColor, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  chart5: "text-chart5",
  destructive: "text-destructive",
}

export const STOP_BORDER_T_CLASS: Record<StopColor, string> = {
  primary: "border-t-primary",
  secondary: "border-t-secondary",
  accent: "border-t-accent",
  chart5: "border-t-chart5",
  destructive: "border-t-destructive",
}

export const STOP_RING_CLASS: Record<StopColor, string> = {
  primary: "ring-primary/30",
  secondary: "ring-secondary/30",
  accent: "ring-accent/30",
  chart5: "ring-chart5/30",
  destructive: "ring-destructive/30",
}
