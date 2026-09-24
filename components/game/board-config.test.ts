import { describe, expect, it } from "vitest"
import {
  FACE_ROTATIONS,
  LADDERS,
  PREDEFINED_ROLLS,
  SNAKES,
  STOPS,
  backPath,
  findLadder,
  findSnake,
  forwardPath,
  goToPath,
  rollForStop,
  shortcutPath,
  squareToGrid,
  squareToWorld,
  stopIndexForSquare,
} from "./board-config"

describe("STOPS", () => {
  it("defines the six section stops in board order", () => {
    expect(STOPS.map((s) => s.sq)).toEqual([1, 6, 12, 18, 22, 25])
  })

  it("labels every stop with its section and color token", () => {
    expect(STOPS.map((s) => s.key)).toEqual([
      "about",
      "skills",
      "projects",
      "services",
      "info",
      "contact",
    ])
    expect(STOPS.map((s) => s.color)).toEqual([
      "primary",
      "secondary",
      "accent",
      "chart5",
      "primary",
      "destructive",
    ])
  })
})

describe("LADDERS and SNAKES", () => {
  it("defines the two ladders with their destination stop index", () => {
    expect(LADDERS).toEqual([
      { from: 2, to: 22, dest: 4 },
      { from: 15, to: 25, dest: 5 },
    ])
  })

  it("defines the two snakes with color and destination stop index", () => {
    expect(SNAKES).toEqual([
      { from: 24, to: 12, dest: 2, color: "destructive" },
      { from: 21, to: 1, dest: 0, color: "chart5" },
    ])
  })

  it("finds a ladder or snake by its starting square", () => {
    expect(findLadder(2)?.to).toBe(22)
    expect(findLadder(3)).toBeUndefined()
    expect(findSnake(24)?.to).toBe(12)
    expect(findSnake(21)?.color).toBe("chart5")
  })
})

describe("FACE_ROTATIONS", () => {
  it("maps every die value 1..6 to an (x, z) rotation pair", () => {
    expect(Object.keys(FACE_ROTATIONS).map(Number).sort()).toEqual([1, 2, 3, 4, 5, 6])
    expect(FACE_ROTATIONS[1]).toEqual([0, 0])
    expect(FACE_ROTATIONS[6]).toEqual([Math.PI, 0])
  })
})

describe("squareToGrid (boustrophedon numbering)", () => {
  it("walks row 0 left to right for squares 1..5", () => {
    expect(squareToGrid(1)).toEqual({ row: 0, col: 0 })
    expect(squareToGrid(5)).toEqual({ row: 0, col: 4 })
  })

  it("reverses direction on row 1 for squares 6..10", () => {
    expect(squareToGrid(6)).toEqual({ row: 1, col: 4 })
    expect(squareToGrid(10)).toEqual({ row: 1, col: 0 })
  })

  it("keeps boustrophedon direction through row 4 (squares 21..25)", () => {
    expect(squareToGrid(21)).toEqual({ row: 4, col: 0 })
    expect(squareToGrid(25)).toEqual({ row: 4, col: 4 })
  })
})

describe("squareToWorld", () => {
  it("centers square 1 at the front-left world corner", () => {
    const { x, z } = squareToWorld(1)
    expect(x).toBeCloseTo(-2.24)
    expect(z).toBeCloseTo(2.24)
  })

  it("places square 13 (center) at the world origin", () => {
    // square 13 -> k=12, row=2, col even-row => 12%5=2 -> col 2 (center)
    const { x, z } = squareToWorld(13)
    expect(x).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)
  })

  it("places square 25 at the far-right world corner", () => {
    const { x, z } = squareToWorld(25)
    expect(x).toBeCloseTo(2.24)
    expect(z).toBeCloseTo(-2.24)
  })
})

describe("stopIndexForSquare", () => {
  it("resolves a stop square to its stop index", () => {
    expect(stopIndexForSquare(1)).toBe(0)
    expect(stopIndexForSquare(18)).toBe(3)
    expect(stopIndexForSquare(25)).toBe(5)
  })

  it("returns -1 for a non-stop square", () => {
    expect(stopIndexForSquare(2)).toBe(-1)
  })
})

describe("rollForStop / PREDEFINED_ROLLS", () => {
  it("computes the predefined die roll for each forward stop transition", () => {
    expect(PREDEFINED_ROLLS).toEqual([5, 6, 6, 4, 3])
  })

  it("matches rollForStop(i) to nextStop.sq - currentStop.sq", () => {
    expect(rollForStop(1)).toBe(5)
    expect(rollForStop(2)).toBe(6)
    expect(rollForStop(3)).toBe(6)
    expect(rollForStop(4)).toBe(4)
    expect(rollForStop(5)).toBe(3)
  })

  it("returns 0 outside the valid stop range", () => {
    expect(rollForStop(0)).toBe(0)
    expect(rollForStop(6)).toBe(0)
  })
})

describe("forwardPath", () => {
  it("lists every square hopped from one stop to the next", () => {
    expect(forwardPath(0)).toEqual([2, 3, 4, 5, 6])
    expect(forwardPath(1)).toEqual([7, 8, 9, 10, 11, 12])
  })

  it("returns an empty path at the final stop", () => {
    expect(forwardPath(5)).toEqual([])
  })
})

describe("backPath", () => {
  it("lists every square walked back from one stop to the previous", () => {
    expect(backPath(1)).toEqual([5, 4, 3, 2, 1])
    expect(backPath(5)).toEqual([24, 23, 22])
  })

  it("returns an empty path at the first stop", () => {
    expect(backPath(0)).toEqual([])
  })
})

describe("goToPath", () => {
  it("returns an empty path when the target stop is the current stop", () => {
    expect(goToPath(2, 2)).toEqual([])
  })

  it("walks square by square forward across multiple stops", () => {
    expect(goToPath(0, 2)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })

  it("walks square by square backward across multiple stops", () => {
    expect(goToPath(3, 0)).toEqual([17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
  })
})

describe("shortcutPath", () => {
  it("walks from the current square to a shortcut's starting square", () => {
    expect(shortcutPath(1, 2)).toEqual([2])
    expect(shortcutPath(6, 15)).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15])
  })

  it("returns an empty path when already on the shortcut square", () => {
    expect(shortcutPath(24, 24)).toEqual([])
  })
})
