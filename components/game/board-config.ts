/**
 * Pure board model for the Snakes & Ladders landing: stop/ladder/snake
 * definitions, die-face rotations, boustrophedon grid math, and the
 * path-planning helpers the scene and overlay UI use to animate the token.
 *
 * No three.js or DOM dependency here on purpose, so this module stays
 * unit-testable in isolation (see board-config.test.ts).
 */

export type StopColor = "primary" | "secondary" | "accent" | "chart5" | "destructive"
export type StopKey = "about" | "skills" | "projects" | "services" | "info" | "contact"

export interface Stop {
  readonly sq: number
  readonly key: StopKey
  readonly label: string
  readonly color: StopColor
}

/** The six section squares, in board order. Rolls between them are predefined (see PREDEFINED_ROLLS). */
export const STOPS: readonly Stop[] = [
  { sq: 1, key: "about", label: "Sobre mí", color: "primary" },
  { sq: 6, key: "skills", label: "Cómo trabajo", color: "secondary" },
  { sq: 12, key: "projects", label: "Casos", color: "accent" },
  { sq: 18, key: "services", label: "Oferta", color: "chart5" },
  { sq: 22, key: "info", label: "Comunidad", color: "primary" },
  { sq: 25, key: "contact", label: "Contacto", color: "destructive" },
]

export interface Ladder {
  readonly from: number
  readonly to: number
  readonly dest: number
}

/** Shortcuts up the board; `dest` is the STOPS index reached on arrival. */
export const LADDERS: readonly Ladder[] = [
  { from: 2, to: 22, dest: 4 },
  { from: 15, to: 25, dest: 5 },
]

export interface Snake {
  readonly from: number
  readonly to: number
  readonly dest: number
  readonly color: "destructive" | "chart5"
}

/** Shortcuts down the board; `dest` is the STOPS index reached on arrival. */
export const SNAKES: readonly Snake[] = [
  { from: 24, to: 12, dest: 2, color: "destructive" },
  { from: 21, to: 1, dest: 0, color: "chart5" },
]

/** Die rotation (x, z) needed to show a given face value on top, plus a random yaw. */
export const FACE_ROTATIONS: Record<number, readonly [number, number]> = {
  1: [0, 0],
  6: [Math.PI, 0],
  2: [-Math.PI / 2, 0],
  5: [Math.PI / 2, 0],
  3: [0, Math.PI / 2],
  4: [0, -Math.PI / 2],
}

export const GRID_SIZE = 5
export const TOTAL_SQUARES = 25
export const TILE_SPACING = 1.12

export interface GridCoord {
  readonly row: number
  readonly col: number
}

/**
 * Boustrophedon numbering starting front-left: row 0 goes left-to-right,
 * row 1 goes right-to-left, and so on.
 */
export function squareToGrid(square: number): GridCoord {
  const k = square - 1
  const row = Math.floor(k / GRID_SIZE)
  const col = row % 2 === 0 ? k % GRID_SIZE : GRID_SIZE - 1 - (k % GRID_SIZE)
  return { row, col }
}

export interface WorldCoord {
  readonly x: number
  readonly z: number
}

/** World-space tile center for a square; row 0 sits nearest the camera (largest z). */
export function squareToWorld(square: number): WorldCoord {
  const { row, col } = squareToGrid(square)
  const center = (GRID_SIZE - 1) / 2
  return { x: (col - center) * TILE_SPACING, z: (center - row) * TILE_SPACING }
}

/** Index into STOPS for a stop square, or -1 if the square isn't a stop. */
export function stopIndexForSquare(square: number): number {
  return STOPS.findIndex((s) => s.sq === square)
}

/** The predefined die roll to advance from stopIndex-1 to stopIndex, or 0 outside range. */
export function rollForStop(stopIndex: number): number {
  if (stopIndex <= 0 || stopIndex >= STOPS.length) return 0
  return STOPS[stopIndex].sq - STOPS[stopIndex - 1].sq
}

/** Predefined forward rolls for each stop transition: [5, 6, 6, 4, 3]. */
export const PREDEFINED_ROLLS: readonly number[] = STOPS.slice(1).map((s, i) => s.sq - STOPS[i].sq)

/** Squares hopped, in order, rolling forward from stopIndex to stopIndex + 1. */
export function forwardPath(stopIndex: number): number[] {
  if (stopIndex < 0 || stopIndex >= STOPS.length - 1) return []
  const a = STOPS[stopIndex].sq
  const b = STOPS[stopIndex + 1].sq
  const path: number[] = []
  for (let s = a + 1; s <= b; s++) path.push(s)
  return path
}

/** Squares walked back, in order, from stopIndex to stopIndex - 1 (no die roll). */
export function backPath(stopIndex: number): number[] {
  if (stopIndex <= 0 || stopIndex >= STOPS.length) return []
  const a = STOPS[stopIndex].sq
  const b = STOPS[stopIndex - 1].sq
  const path: number[] = []
  for (let s = a - 1; s >= b; s--) path.push(s)
  return path
}

/**
 * Squares hopped, in order, walking directly (fast, no die) from the
 * current stop's square to the target stop's square. When the target is
 * exactly the next stop, prefer forwardPath so the roll/animation plays.
 */
export function goToPath(fromStopIndex: number, toStopIndex: number, fromSquare?: number): number[] {
  if (fromStopIndex === toStopIndex) return []
  const a = fromSquare ?? STOPS[fromStopIndex].sq
  const b = STOPS[toStopIndex].sq
  const d = Math.sign(b - a)
  const path: number[] = []
  for (let s = a; s !== b; s += d) path.push(s + d)
  return path
}

/** Squares hopped, in order, walking from the current square to a shortcut's starting square. */
export function shortcutPath(fromSquare: number, targetFrom: number): number[] {
  const d = Math.sign(targetFrom - fromSquare)
  if (d === 0) return []
  const path: number[] = []
  for (let s = fromSquare; s !== targetFrom; s += d) path.push(s + d)
  return path
}

export function findLadder(fromSquare: number): Ladder | undefined {
  return LADDERS.find((l) => l.from === fromSquare)
}

export function findSnake(fromSquare: number): Snake | undefined {
  return SNAKES.find((s) => s.from === fromSquare)
}
