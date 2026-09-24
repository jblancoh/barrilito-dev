"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import * as THREE from "three"
import { toHslColor } from "./color"
import {
  FACE_ROTATIONS,
  LADDERS,
  SNAKES,
  STOPS,
  findLadder,
  findSnake,
  squareToGrid,
  squareToWorld,
  type Ladder,
  type Snake,
  type Stop,
  type StopColor,
} from "./board-config"

/* ------------------------------------------------------------------ */
/* Public types                                                        */
/* ------------------------------------------------------------------ */

export type CameraMode = "A" | "B"

export interface BoardSceneState {
  stop: number
  sq: number
  moving: boolean
  rolling: boolean
  roll: number | null
  statusText: string
  ready: boolean
}

export interface BoardSceneLayout {
  narrow: boolean
  rail: boolean
  panelWidth: string
}

export interface UseBoardSceneOptions {
  /** Resolved dark/light theme (from next-themes), read once and on every change. */
  dark: boolean
  /** A = isometric table camera, B = perspective token camera (default). */
  camera?: CameraMode
  /** Animation speed multiplier, 0.5–2 (default 1). */
  speed?: number
  /** Whether the META arrival should trigger confetti (default true). */
  confetti?: boolean
  /** Called after the arrival animation settles on a new stop (e.g. to reset panel scroll). */
  onArrive?: () => void
}

export interface BoardSceneApi {
  forward: () => void
  back: () => void
  goTo: (stopIndex: number) => void
  shortcut: (kind: "ladder" | "snake", index: number) => void
  isBusy: () => boolean
  getLockUntil: () => number
}

export interface UseBoardSceneResult {
  api: BoardSceneApi
  state: BoardSceneState
  layout: BoardSceneLayout
}

/* ------------------------------------------------------------------ */
/* Palette — read live from CSS variables, never hardcoded             */
/* ------------------------------------------------------------------ */

interface Palette {
  background: string
  foreground: string
  card: string
  muted: string
  mutedForeground: string
  primary: string
  secondary: string
  accent: string
  destructive: string
  chart5: string
  border: string
  tileA: string
  tileB: string
  slab: string
  line: string
}

function cssHsl(name: string): string {
  return toHslColor(getComputedStyle(document.documentElement).getPropertyValue(name))
}

function withAlpha(hsl: string, alpha: number): string {
  const match = hsl.match(/hsl\(([^)]+)\)/)
  const triple = (match ? match[1] : "0 0% 0%").split(/[\s,]+/).filter(Boolean)
  const [h, s, l] = triple
  return `hsla(${h}, ${s}, ${l}, ${alpha})`
}

function buildPalette(dark: boolean): Palette {
  const background = cssHsl("--background")
  const foreground = cssHsl("--foreground")
  const card = cssHsl("--card")
  const muted = cssHsl("--muted")
  const mutedForeground = cssHsl("--muted-foreground")
  const primary = cssHsl("--primary")
  const secondary = cssHsl("--secondary")
  const accent = cssHsl("--accent")
  const destructive = cssHsl("--destructive")
  const chart5 = cssHsl("--chart-5")
  const border = cssHsl("--border")
  return {
    background,
    foreground,
    card,
    muted,
    mutedForeground,
    primary,
    secondary,
    accent,
    destructive,
    chart5,
    border,
    tileA: card,
    tileB: muted,
    slab: dark ? "hsl(0, 0%, 13%)" : border,
    line: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
  }
}

function paletteColor(pal: Palette, token: StopColor): string {
  switch (token) {
    case "primary":
      return pal.primary
    case "secondary":
      return pal.secondary
    case "accent":
      return pal.accent
    case "chart5":
      return pal.chart5
    case "destructive":
      return pal.destructive
  }
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/* ------------------------------------------------------------------ */
/* Isolated object builders (swappable for GLTF later)                 */
/* ------------------------------------------------------------------ */

interface TileRecord {
  mesh: THREE.Mesh
  side: THREE.MeshStandardMaterial
  top: THREE.MeshStandardMaterial
  stop?: Stop
  h: number
  row: number
  col: number
  flash: number
}

function buildTileTexture(
  square: number,
  tile: TileRecord,
  pal: Palette,
  dark: boolean,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext("2d")!
  const fill = tile.stop
    ? paletteColor(pal, tile.stop.color)
    : (tile.row + tile.col) % 2
      ? pal.tileB
      : pal.tileA
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, 256, 256)
  ctx.strokeStyle = pal.line
  ctx.lineWidth = 6
  ctx.strokeRect(12, 12, 232, 232)

  const ink = tile.stop
    ? tile.stop.color === "destructive" || (tile.stop.color === "chart5" && !dark)
      ? "#fff"
      : "#000"
    : pal.mutedForeground
  ctx.fillStyle = ink
  ctx.textBaseline = "top"
  ctx.font = '600 50px "Geist Mono", monospace'
  ctx.fillText(String(square).padStart(2, "0"), 26, 24)

  if (tile.stop) {
    ctx.font = "700 38px Inter, sans-serif"
    const words = tile.stop.label.split(" ")
    const lines: string[] = []
    let line = ""
    for (const word of words) {
      const attempt = line ? `${line} ${word}` : word
      if (ctx.measureText(attempt).width > 206 && line) {
        lines.push(line)
        line = word
      } else {
        line = attempt
      }
    }
    lines.push(line)
    ctx.textBaseline = "alphabetic"
    lines.forEach((l, k) => ctx.fillText(l, 26, 226 - (lines.length - 1 - k) * 42))
  }

  const ladder = findLadder(square)
  const snake = findSnake(square)
  if (ladder || snake) {
    ctx.font = '600 34px "Geist Mono", monospace'
    ctx.textAlign = "right"
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = ladder ? pal.secondary : paletteColor(pal, snake!.color)
    const target = ladder ? ladder.to : snake!.to
    ctx.fillText(`${ladder ? "▲" : "▼"}${String(target).padStart(2, "0")}`, 230, 226)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function buildDieTextures(pal: Palette): THREE.MeshStandardMaterial[] {
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z
  const faceValues = [3, 4, 1, 6, 2, 5]
  const pips: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [
      [0, 0],
      [2, 2],
    ],
    3: [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    4: [
      [0, 0],
      [2, 0],
      [0, 2],
      [2, 2],
    ],
    5: [
      [0, 0],
      [2, 0],
      [1, 1],
      [0, 2],
      [2, 2],
    ],
    6: [
      [0, 0],
      [2, 0],
      [0, 1],
      [2, 1],
      [0, 2],
      [2, 2],
    ],
  }
  return faceValues.map((value) => {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 128
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#e9e9e9"
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = "#fafafa"
    ctx.beginPath()
    if (typeof ctx.roundRect === "function") ctx.roundRect(6, 6, 116, 116, 22)
    else ctx.rect(6, 6, 116, 116)
    ctx.fill()
    ctx.fillStyle = value === 1 ? pal.destructive : "#121212"
    pips[value].forEach(([i, j]) => {
      ctx.beginPath()
      ctx.arc(30 + i * 34, 30 + j * 34, value === 1 ? 15 : 11, 0, Math.PI * 2)
      ctx.fill()
    })
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 })
  })
}

function buildTokenGlowTexture(pal: Palette): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext("2d")!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, withAlpha(pal.primary, 0.9))
  gradient.addColorStop(0.45, withAlpha(pal.secondary, 0.45))
  gradient.addColorStop(0.75, withAlpha(pal.accent, 0.18))
  gradient.addColorStop(1, withAlpha(pal.accent, 0))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Builds the barrel token group: lathe body, hoops, staves, floating atom, glow sprite. */
function buildTokenGroup(): {
  group: THREE.Group
  bodyMat: THREE.MeshStandardMaterial
  hoopMat: THREE.MeshStandardMaterial
  atomMat: THREE.MeshStandardMaterial
  atom: THREE.Group
  rings: THREE.Group[]
  glow: THREE.Sprite
} {
  const group = new THREE.Group()
  const radiusAt = (t: number) => 0.2 + 0.07 * Math.sin(Math.PI * t)
  const height = 0.62
  const profile: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
  for (let k = 0; k <= 20; k++) {
    const t = k / 20
    profile.push(new THREE.Vector2(radiusAt(t), t * height))
  }
  profile.push(new THREE.Vector2(0, height))

  const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.4 })
  const hoopMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 })
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), bodyMat)
  body.castShadow = true
  group.add(body)

  ;[0.06, 0.2, 0.8, 0.94].forEach((t) => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(t) + 0.006, 0.02, 8, 48), hoopMat)
    hoop.rotation.x = Math.PI / 2
    hoop.position.y = t * height
    group.add(hoop)
  })

  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2
    const points: THREE.Vector3[] = []
    for (let j = 0; j <= 10; j++) {
      const t = 0.2 + (j / 10) * 0.6
      const r = radiusAt(t) + 0.004
      points.push(new THREE.Vector3(Math.sin(angle) * r, t * height, Math.cos(angle) * r))
    }
    const stave = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, 0.008, 5),
      hoopMat,
    )
    group.add(stave)
  }

  const atom = new THREE.Group()
  atom.position.y = 0.98
  const atomMat = new THREE.MeshStandardMaterial({ roughness: 0.2, emissiveIntensity: 0.9 })
  atom.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 16), atomMat))
  const rings = [0, 1, 2].map((k) => {
    const pivot = new THREE.Group()
    pivot.rotation.z = (k * Math.PI) / 3
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 64), atomMat)
    ring.scale.set(1, 0.38, 1)
    ring.rotation.x = Math.PI / 2
    pivot.add(ring)
    atom.add(pivot)
    return pivot
  })
  group.add(atom)

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({ transparent: true, depthWrite: false }),
  )
  glow.scale.set(1.9, 1.9, 1)
  glow.position.y = 0.55
  group.add(glow)

  return { group, bodyMat, hoopMat, atomMat, atom, rings, glow }
}

/** Builds the 6-face die mesh; textures/materials regenerated per theme via buildDieTextures. */
function buildDieMesh(materials: THREE.MeshStandardMaterial[]): THREE.Mesh {
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), materials)
  die.castShadow = true
  die.rotation.order = "YXZ"
  return die
}

interface SnakeRecord {
  curve: THREE.CatmullRomCurve3
  geo: THREE.TubeGeometry
  mat: THREE.MeshStandardMaterial
  headMat: THREE.MeshStandardMaterial
  head: THREE.Group
  tongue: THREE.Mesh
  base: number
  def: Snake
  radialSegments: number
  tubularSegments: number
}

/** Builds one snake's tube body + head (eyes, pupils, tongue) isolated from the tube. */
function buildSnakeRecord(def: Snake, index: number, tokenAt: (sq: number) => THREE.Vector3): SnakeRecord {
  const y = 0.4
  const a = tokenAt(def.from).setY(y)
  const b = tokenAt(def.to).setY(y)
  const dir = b.clone().sub(a)
  const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize()
  const points: THREE.Vector3[] = []
  for (let j = 0; j <= 14; j++) {
    const t = j / 14
    points.push(
      a
        .clone()
        .add(dir.clone().multiplyScalar(t))
        .add(perp.clone().multiplyScalar(Math.sin(t * Math.PI * 3.2 + index) * 0.42 * Math.sqrt(Math.sin(Math.PI * t)))),
    )
  }
  const curve = new THREE.CatmullRomCurve3(points)
  const tubularSegments = 160
  const radialSegments = 12
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 0.12, radialSegments, false)
  const posAttr = geo.attributes.position
  const colors = new Float32Array(posAttr.count * 3)
  for (let v = 0; v < posAttr.count; v++) {
    const i = Math.floor(v / (radialSegments + 1))
    const u = i / tubularSegments
    const center = curve.getPointAt(u)
    const k = u < 0.08 ? 1 : 1 - ((u - 0.08) / 0.92) * 0.8
    posAttr.setXYZ(
      v,
      center.x + (posAttr.getX(v) - center.x) * k,
      center.y + (posAttr.getY(v) - center.y) * k,
      center.z + (posAttr.getZ(v) - center.z) * k,
    )
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 })

  const head = new THREE.Group()
  const headMat = new THREE.MeshStandardMaterial({ roughness: 0.35 })
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), headMat)
  skull.scale.set(1.15, 0.75, 1.35)
  skull.castShadow = true
  head.add(skull)
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  const black = new THREE.MeshBasicMaterial({ color: 0x000000 })
  ;[-1, 1].forEach((sign) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), white)
    eye.position.set(sign * 0.08, 0.08, 0.1)
    head.add(eye)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), black)
    pupil.position.set(sign * 0.085, 0.095, 0.14)
    head.add(pupil)
  })
  const tongue = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.01, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xff3355 }),
  )
  tongue.position.set(0, -0.02, 0.26)
  head.add(tongue)
  const h0 = curve.getPointAt(0)
  const tangent = curve.getTangentAt(0).negate()
  head.position.copy(h0).add(new THREE.Vector3(0, 0.05, 0))
  head.lookAt(head.position.clone().add(tangent))

  return {
    curve,
    geo,
    mat,
    headMat,
    head,
    tongue,
    base: head.position.y,
    def,
    radialSegments,
    tubularSegments,
  }
}

function paintSnake(record: SnakeRecord, pal: Palette): void {
  const base = new THREE.Color(paletteColor(pal, record.def.color))
  const light = base.clone().lerp(new THREE.Color(0xffffff), 0.35)
  const dark = base.clone().multiplyScalar(0.7)
  const colorAttr = record.geo.attributes.color
  for (let v = 0; v < colorAttr.count; v++) {
    const i = Math.floor(v / (record.radialSegments + 1))
    const u = i / record.tubularSegments
    const ring = v % (record.radialSegments + 1)
    const c = Math.floor(u * 18) % 2 ? light : base
    const cc = ring > record.radialSegments * 0.55 && ring < record.radialSegments * 0.95 ? c.clone().lerp(dark, 0.5) : c
    colorAttr.setXYZ(v, cc.r, cc.g, cc.b)
  }
  colorAttr.needsUpdate = true
  record.headMat.color.copy(base)
}

/* ------------------------------------------------------------------ */
/* Animation queue task                                                */
/* ------------------------------------------------------------------ */

interface QueueTask {
  dur: number
  update: (t: number) => void
  end?: () => void
  start?: () => void
  t: number
}

interface FxRing {
  kind: "ring"
  mesh: THREE.Mesh
  t: number
  dur: number
  size: number
}

interface FxConfetti {
  kind: "conf"
  mesh: THREE.Mesh
  t: number
  dur: number
  velocity: THREE.Vector3
  angularVelocity: THREE.Vector3
}

type Fx = FxRing | FxConfetti

/* ------------------------------------------------------------------ */
/* BoardScene — imperative three.js scene, framework-agnostic          */
/* ------------------------------------------------------------------ */

interface BoardSceneOpts {
  host: HTMLDivElement
  dark: boolean
  camera: CameraMode
  speed: number
  confetti: boolean
  onState: (state: BoardSceneState) => void
  onLayout: (layout: BoardSceneLayout) => void
  onArrive?: () => void
}

class BoardScene {
  private host: HTMLDivElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private ortho!: THREE.OrthographicCamera
  private persp!: THREE.PerspectiveCamera
  private hemi!: THREE.HemisphereLight
  private sun!: THREE.DirectionalLight
  private ground!: THREE.Mesh
  private slab!: THREE.Mesh
  private tiles: Record<number, TileRecord> = {}
  private ladderMat!: THREE.MeshStandardMaterial
  private ladders: { a: THREE.Vector3; b: THREE.Vector3; def: Ladder }[] = []
  private snakes: SnakeRecord[] = []
  private token!: THREE.Group
  private bodyMat!: THREE.MeshStandardMaterial
  private hoopMat!: THREE.MeshStandardMaterial
  private atomMat!: THREE.MeshStandardMaterial
  private atom!: THREE.Group
  private rings: THREE.Group[] = []
  private glow!: THREE.Sprite
  private die!: THREE.Mesh
  private fog: THREE.Fog | null = null
  private fogColor!: THREE.Color

  private ro: ResizeObserver | null = null
  private raf = 0
  private last = 0
  private t = 0
  private q: QueueTask[] = []
  private cur: QueueTask | null = null
  private busy = false
  private lockUntil = 0
  private fx: Fx[] = []
  private camTarget = new THREE.Vector3()
  private camPos: THREE.Vector3 | null = null
  private narrow = false
  private shiftX = 0
  private shiftY = 0
  private viewH = 8
  private asp = 1
  private lastLayout: BoardSceneLayout | null = null

  private dark: boolean
  private cameraMode: CameraMode
  private speed: number
  private confettiEnabled: boolean
  private reducedMotion: boolean
  private reducedMotionQuery: MediaQueryList | null = null

  private state = {
    stop: 0,
    sq: 1,
    moving: false,
    rolling: false,
    roll: null as number | null,
    ready: false,
  }

  constructor(private opts: BoardSceneOpts) {
    this.host = opts.host
    this.dark = opts.dark
    this.cameraMode = opts.camera
    this.speed = clamp(opts.speed, 0.5, 2)
    this.confettiEnabled = opts.confetti
    this.reducedMotion =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false
    if (typeof window !== "undefined" && window.matchMedia) {
      this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      this.reducedMotionQuery.addEventListener?.("change", this.onReducedMotionChange)
    }
    this.init().catch((err) => console.error("[board-scene] init failed", err))
  }

  private onReducedMotionChange = (e: MediaQueryListEvent) => {
    this.reducedMotion = e.matches
  }

  private emitState() {
    const { stop, sq, moving, rolling, roll, ready } = this.state
    const statusText = rolling
      ? "Tirando el dado…"
      : roll != null
        ? `¡Sacaste un ${roll}!`
        : moving
          ? "Avanzando…"
          : "Tu turno"
    this.opts.onState({ stop, sq, moving, rolling, roll, ready, statusText })
  }

  private async init() {
    try {
      await document.fonts.ready
      await Promise.all([document.fonts.load('700 36px Inter'), document.fonts.load('600 48px "Geist Mono"')])
    } catch {
      // Fonts may fail to load in some environments; textures still render with fallbacks.
    }

    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true }))
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;"
    this.host.appendChild(renderer.domElement)

    const scene = (this.scene = new THREE.Scene())
    scene.background = new THREE.Color()
    this.fogColor = new THREE.Color()

    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200)
    this.persp = new THREE.PerspectiveCamera(42, 1, 0.1, 200)

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x445066, 1.3)
    scene.add(this.hemi)
    const sun = (this.sun = new THREE.DirectionalLight(0xffffff, 2.0))
    sun.position.set(4, 10, 6)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 })
    sun.shadow.bias = -0.0006
    scene.add(sun)

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.3 }))
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = -0.3
    this.ground.receiveShadow = true
    scene.add(this.ground)

    this.buildBoard()
    this.buildLadders()
    this.buildSnakes()
    this.buildToken()
    this.buildDie()
    this.applyTheme(this.dark)

    this.token.position.copy(this.tokenAt(1))
    this.die.position.copy(this.dieRest(1))
    this.die.rotation.set(0, 0.6, 0)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(this.host)
    this.resize()

    this.last = performance.now()
    this.loop()
    this.state.ready = true
    this.emitState()
  }

  private pos(square: number) {
    return squareToWorld(square)
  }

  private topY(square: number): number {
    return this.tiles[square].h
  }

  private tokenAt(square: number): THREE.Vector3 {
    const p = this.pos(square)
    return new THREE.Vector3(p.x, this.topY(square), p.z)
  }

  private buildBoard() {
    this.slab = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.3, 6.2),
      new THREE.MeshStandardMaterial({ roughness: 0.85 }),
    )
    this.slab.position.y = -0.15
    this.slab.receiveShadow = true
    this.slab.castShadow = true
    this.scene.add(this.slab)

    for (let i = 1; i <= 25; i++) {
      const stop = STOPS.find((s) => s.sq === i)
      const h = stop ? 0.3 : 0.14
      const side = new THREE.MeshStandardMaterial({ roughness: 0.6 })
      const top = new THREE.MeshStandardMaterial({ roughness: 0.55, emissive: new THREE.Color(0x000000) })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.04, h, 1.04), [side, side, top, side, side, side])
      const p = this.pos(i)
      const { row, col } = squareToGrid(i)
      mesh.position.set(p.x, h / 2, p.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.tiles[i] = { mesh, side, top, stop, h, row, col, flash: 0 }
    }
  }

  private cylinder(p1: THREE.Vector3, p2: THREE.Vector3, r: number, mat: THREE.Material, group: THREE.Group) {
    const v = p2.clone().sub(p1)
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 10), mat)
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize())
    mesh.castShadow = true
    group.add(mesh)
    return mesh
  }

  private buildLadders() {
    this.ladderMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 })
    this.ladders = LADDERS.map((ladderDef) => {
      const group = new THREE.Group()
      const Y = 0.46
      const a = this.tokenAt(ladderDef.from).setY(Y)
      const b = this.tokenAt(ladderDef.to).setY(Y)
      const dir = b.clone().sub(a)
      const len = dir.length()
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.2)
      this.cylinder(a.clone().add(perp), b.clone().add(perp), 0.04, this.ladderMat, group)
      this.cylinder(a.clone().sub(perp), b.clone().sub(perp), 0.04, this.ladderMat, group)
      const rungs = Math.max(3, Math.round(len / 0.34))
      for (let k = 1; k < rungs; k++) {
        const p = a.clone().add(dir.clone().multiplyScalar(k / rungs))
        this.cylinder(p.clone().add(perp), p.clone().sub(perp), 0.028, this.ladderMat, group)
      }
      ;([[a, ladderDef.from], [b, ladderDef.to]] as const).forEach(([p, sq]) => {
        ;[1, -1].forEach((sign) => {
          const q = p.clone().add(perp.clone().multiplyScalar(sign))
          this.cylinder(q.clone().setY(this.topY(sq)), q, 0.03, this.ladderMat, group)
        })
      })
      this.scene.add(group)
      return { a, b, def: ladderDef }
    })
  }

  private buildSnakes() {
    this.snakes = SNAKES.map((def, index) => buildSnakeRecord(def, index, (sq) => this.tokenAt(sq)))
    this.snakes.forEach((record) => {
      const body = new THREE.Mesh(record.geo, record.mat)
      body.castShadow = true
      this.scene.add(body)
      this.scene.add(record.head)
    })
  }

  private buildToken() {
    const built = buildTokenGroup()
    this.token = built.group
    this.bodyMat = built.bodyMat
    this.hoopMat = built.hoopMat
    this.atomMat = built.atomMat
    this.atom = built.atom
    this.rings = built.rings
    this.glow = built.glow
    this.scene.add(this.token)
  }

  private buildDie() {
    const materials = buildDieTextures(buildPalette(this.dark))
    this.die = buildDieMesh(materials)
    this.scene.add(this.die)
  }

  private dieRest(sq: number): THREE.Vector3 {
    const p = this.tokenAt(sq)
    let dx = -p.x
    let dz = -p.z
    const len = Math.hypot(dx, dz)
    if (len < 0.5) {
      dx = 0.7
      dz = 0.7
    } else {
      dx /= len
      dz /= len
    }
    const a = 0.6
    const rx = dx * Math.cos(a) - dz * Math.sin(a)
    const rz = dx * Math.sin(a) + dz * Math.cos(a)
    const x = p.x + rx * 0.95
    const z = p.z + rz * 0.95
    let best = 1
    let bestDist = Infinity
    for (let i = 1; i <= 25; i++) {
      const q = this.pos(i)
      const d = (q.x - x) ** 2 + (q.z - z) ** 2
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return new THREE.Vector3(x, this.topY(best) + 0.23, z)
  }

  applyTheme(dark: boolean) {
    this.dark = dark
    if (!this.scene) return
    const pal = buildPalette(dark)
    ;(this.scene.background as THREE.Color).set(pal.background)
    this.fogColor.set(pal.background)
    ;(this.slab.material as THREE.MeshStandardMaterial).color.set(pal.slab)

    for (let i = 1; i <= 25; i++) {
      const tile = this.tiles[i]
      if (tile.top.map) tile.top.map.dispose()
      tile.top.map = buildTileTexture(i, tile, pal, dark)
      tile.top.color.set(0xffffff)
      tile.top.needsUpdate = true
      const fill = tile.stop
        ? paletteColor(pal, tile.stop.color)
        : (tile.row + tile.col) % 2
          ? pal.tileB
          : pal.tileA
      tile.side.color.set(fill).multiplyScalar(0.78)
      if (tile.stop) tile.top.emissive.set(paletteColor(pal, tile.stop.color))
    }

    this.ladderMat.color.set(pal.secondary)
    this.snakes.forEach((s) => paintSnake(s, pal))

    this.bodyMat.color.set(dark ? pal.foreground : "hsl(0, 0%, 12%)")
    this.hoopMat.color.set(dark ? "hsl(0, 0%, 10%)" : "hsl(0, 0%, 96%)")
    this.atomMat.color.set(pal.primary)
    this.atomMat.emissive.set(pal.primary)
    if (this.glow.material.map) this.glow.material.map.dispose()
    this.glow.material.map = buildTokenGlowTexture(pal)
    this.glow.material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending
    this.glow.material.opacity = dark ? 0.55 : 0.45
    this.glow.material.needsUpdate = true

    ;(this.ground.material as THREE.ShadowMaterial).opacity = dark ? 0.35 : 0.12
    this.hemi.intensity = dark ? 1.2 : 1.6
    this.sun.intensity = dark ? 2.0 : 1.7

    const dieMaterials = this.die.material as THREE.MeshStandardMaterial[]
    dieMaterials.forEach((m) => m.map?.dispose())
    this.die.material = buildDieTextures(pal)
  }

  private resize() {
    if (!this.renderer) return
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    if (w === 0 || h === 0) return
    const asp = w / h
    const narrow = w < 900
    const rail = w >= 1180
    this.renderer.setSize(w, h, false)
    const panelW = narrow ? w - 32 : Math.min(520, Math.round(w * 0.46))
    const leftCol = rail ? 260 : 0
    const availPx = narrow ? w : w - panelW - 32 - leftCol
    this.narrow = narrow
    this.shiftX = narrow ? 0 : 0.5 - (leftCol + availPx / 2) / w
    const topFrac = 64 / h
    this.shiftY = narrow ? -(0.5 - (topFrac + 0.46) / 2) : topFrac / 2
    this.viewH = narrow
      ? Math.max(9.2 / asp, 6.4 / Math.max(0.2, 0.46 - topFrac))
      : Math.max(6.8 / (1 - topFrac), 9.4 / (availPx / w) / asp)

    const layout: BoardSceneLayout = {
      narrow,
      rail,
      panelWidth: narrow ? "calc(100% - 32px)" : `${panelW}px`,
    }
    if (!this.lastLayout || JSON.stringify(layout) !== JSON.stringify(this.lastLayout)) {
      this.lastLayout = layout
      this.opts.onLayout(layout)
    }

    const o = this.ortho
    o.left = (-this.viewH * asp) / 2
    o.right = (this.viewH * asp) / 2
    o.top = this.viewH / 2
    o.bottom = -this.viewH / 2
    o.updateProjectionMatrix()
    this.persp.aspect = asp
    this.persp.fov = narrow ? 58 : 42
    this.persp.updateProjectionMatrix()
    this.asp = asp
  }

  /* -------------------- animation queue -------------------- */

  private enq(dur: number, update: (t: number) => void, end?: () => void, start?: () => void) {
    this.q.push({ dur: Math.max(0.001, dur), update, end, start, t: 0 })
  }

  private wait(d: number) {
    this.enq(d, () => {})
  }

  private runQueue(dt: number) {
    let c = this.cur
    if (!c) {
      if (!this.q.length) return
      c = this.cur = this.q.shift()!
      c.t = 0
      c.start?.()
    }
    c.t = Math.min(1, c.t + dt / c.dur)
    c.update(c.t)
    if (c.t >= 1) {
      this.cur = null
      c.end?.()
    }
  }

  private jump(getTarget: () => THREE.Vector3, dur: number, arc: number, onEnd?: (b: THREE.Vector3) => void) {
    const reduced = this.reducedMotion
    const effDur = reduced ? Math.min(dur, 0.12) : dur
    const effArc = reduced ? 0 : arc
    let a: THREE.Vector3
    let b: THREE.Vector3
    this.enq(
      effDur,
      (t) => {
        const e = ease(t)
        const tk = this.token
        tk.position.set(
          a.x + (b.x - a.x) * e,
          a.y + (b.y - a.y) * e + Math.sin(Math.PI * t) * effArc,
          a.z + (b.z - a.z) * e,
        )
        const sq = Math.sin(Math.PI * t)
        tk.scale.set(1 - 0.06 * sq, 1 + 0.12 * sq, 1 - 0.06 * sq)
      },
      () => {
        this.token.scale.set(1, 1, 1)
        onEnd?.(b)
      },
      () => {
        a = this.token.position.clone()
        b = getTarget()
        if (Math.hypot(b.x - a.x, b.z - a.z) > 0.01) this.token.rotation.y = Math.atan2(b.x - a.x, b.z - a.z)
      },
    )
  }

  private hopSq(to: number, dur: number) {
    this.jump(
      () => this.tokenAt(to),
      dur,
      0.42,
      (b) => {
        this.ripple(b, this.currentTileFill(to), 0.6, false)
        this.state.sq = to
        this.emitState()
      },
    )
  }

  private currentTileFill(square: number): string {
    const pal = buildPalette(this.dark)
    const tile = this.tiles[square]
    return tile.stop
      ? paletteColor(pal, tile.stop.color)
      : (tile.row + tile.col) % 2
        ? pal.tileB
        : pal.tileA
  }

  private rollDie(value: number) {
    const reduced = this.reducedMotion
    let land: THREE.Vector3
    let start: THREE.Vector3
    let tx = 0
    let tz = 0
    let yaw = 0
    let sx = 0
    let sy = 0
    let sz = 0
    this.enq(
      reduced ? 0.12 : 0.95,
      (t) => {
        const e = 1 - Math.pow(1 - t, 3)
        const d = this.die
        d.position.set(
          start.x + (land.x - start.x) * e,
          land.y + (reduced ? 0 : 2.6 * Math.pow(1 - t, 2) + Math.abs(Math.sin(t * Math.PI * 2.5)) * 0.35 * (1 - t)),
          start.z + (land.z - start.z) * e,
        )
        d.rotation.set(tx + sx * (1 - e), yaw + sy * (1 - e), tz + sz * (1 - e))
      },
      () => {
        this.state.rolling = false
        this.state.roll = value
        this.emitState()
        this.ripple(land.clone().setY(land.y - 0.22), buildPalette(this.dark).foreground, 0.9, false)
      },
      () => {
        land = this.dieRest(this.state.sq)
        start = reduced ? land.clone() : land.clone().add(new THREE.Vector3(-1.8, 0, -1.4))
        const [fx, fz] = FACE_ROTATIONS[value]
        tx = fx
        tz = fz
        yaw = Math.random() * Math.PI * 2
        const spin = () => Math.PI * 2 * (2 + Math.floor(Math.random() * 2))
        sx = reduced ? 0 : spin()
        sy = reduced ? 0 : Math.PI * 2
        sz = reduced ? 0 : spin()
        this.state.rolling = true
        this.state.roll = null
        this.emitState()
      },
    )
  }

  private startMove() {
    this.busy = true
    this.state.moving = true
    this.state.roll = null
    this.emitState()
  }

  private arrive(stopIndex: number) {
    this.enq(0.01, () => {}, () => {
      const stop = STOPS[stopIndex]
      const tile = this.tiles[stop.sq]
      tile.flash = 1
      this.ripple(this.tokenAt(stop.sq), paletteColor(buildPalette(this.dark), stop.color), 1.6, true)
      if (stopIndex === STOPS.length - 1 && this.confettiEnabled && !this.reducedMotion) this.confetti()
      this.busy = false
      this.lockUntil = performance.now() + 450
      this.state.stop = stopIndex
      this.state.sq = stop.sq
      this.state.moving = false
      this.emitState()
      this.opts.onArrive?.()
    })
  }

  forward = () => {
    if (this.busy || !this.scene) return
    const i = this.state.stop
    if (i >= STOPS.length - 1) return
    const a = STOPS[i].sq
    const b = STOPS[i + 1].sq
    this.startMove()
    this.rollDie(b - a)
    this.wait(0.18)
    for (let s = a; s < b; s++) this.hopSq(s + 1, 0.3)
    this.arrive(i + 1)
  }

  back = () => {
    if (this.busy || !this.scene) return
    const i = this.state.stop
    if (i <= 0) return
    this.startMove()
    for (let s = STOPS[i].sq; s > STOPS[i - 1].sq; s--) this.hopSq(s - 1, 0.2)
    this.arrive(i - 1)
  }

  goTo = (targetStopIndex: number) => {
    if (this.busy || !this.scene) return
    const i = this.state.stop
    if (targetStopIndex === i) return
    if (targetStopIndex === i + 1) return this.forward()
    this.startMove()
    const a = STOPS[i].sq
    const b = STOPS[targetStopIndex].sq
    const d = Math.sign(b - a)
    for (let s = a; s !== b; s += d) this.hopSq(s + d, 0.14)
    this.arrive(targetStopIndex)
  }

  shortcut = (kind: "ladder" | "snake", index: number) => {
    if (this.busy || !this.scene) return
    const obj = kind === "ladder" ? this.ladders[index] : this.snakes[index]
    const def = obj.def
    this.startMove()
    const from = this.state.sq
    const d = Math.sign(def.from - from)
    for (let s = from; s !== def.from; s += d) this.hopSq(s + d, 0.2)

    if (kind === "ladder") {
      const ladder = obj as { a: THREE.Vector3; b: THREE.Vector3; def: Ladder }
      const len = ladder.a.distanceTo(ladder.b)
      this.jump(() => ladder.a.clone(), 0.25, 0.25)
      this.enq(
        (0.35 * len) / this.speed,
        (t) => {
          const e = ease(t)
          const p = ladder.a.clone().lerp(ladder.b, e)
          this.token.position.set(p.x, p.y + Math.abs(Math.sin(t * Math.PI * len * 2.6)) * 0.08, p.z)
        },
        undefined,
        () => {
          this.token.rotation.y = Math.atan2(ladder.b.x - ladder.a.x, ladder.b.z - ladder.a.z)
        },
      )
    } else {
      const snake = obj as SnakeRecord
      this.jump(() => snake.curve.getPointAt(0).clone(), 0.3, 0.3)
      this.enq(this.reducedMotion ? 0.2 : 1.8, (t) => {
        const u = Math.pow(t, 1.6) * 0.995
        const p = snake.curve.getPointAt(u)
        const tangent = snake.curve.getTangentAt(u)
        this.token.position.copy(p)
        this.token.rotation.y = Math.atan2(tangent.x, tangent.z) + (this.reducedMotion ? 0 : t * Math.PI * 4)
      })
    }

    this.jump(
      () => this.tokenAt(def.to),
      0.35,
      0.35,
      () => {
        this.state.sq = def.to
        this.emitState()
      },
    )
    this.arrive(def.dest)
  }

  isBusy = () => this.busy
  getLockUntil = () => this.lockUntil

  /* -------------------- fx -------------------- */

  private ripple(p: THREE.Vector3, color: string, size: number, big: boolean) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.3, big ? 0.4 : 0.35, 48),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(p.x, p.y + 0.02, p.z)
    this.scene.add(mesh)
    this.fx.push({ kind: "ring", mesh, t: 0, dur: big ? 1.1 : 0.6, size })
  }

  private confetti() {
    const pal = buildPalette(this.dark)
    const colors = [pal.primary, pal.secondary, pal.accent, pal.destructive, pal.chart5]
    const origin = this.tokenAt(25)
    for (let k = 0; k < 90; k++) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.06, 0.11),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(colors[k % 5]), side: THREE.DoubleSide, transparent: true }),
      )
      mesh.position.set(origin.x, origin.y + 0.8, origin.z)
      this.scene.add(mesh)
      const a = Math.random() * Math.PI * 2
      const sp = 1 + Math.random() * 2.2
      this.fx.push({
        kind: "conf",
        mesh,
        t: 0,
        dur: 2.6,
        velocity: new THREE.Vector3(Math.cos(a) * sp, 3 + Math.random() * 3, Math.sin(a) * sp),
        angularVelocity: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      })
    }
  }

  private updateFx(dt: number) {
    this.fx = this.fx.filter((f) => {
      f.t += dt / f.dur
      if (f.kind === "ring") {
        const s = 1 + f.t * f.size * 2.2
        f.mesh.scale.set(s, s, s)
        ;(f.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - f.t
      } else {
        f.velocity.y -= 7 * dt
        f.mesh.position.addScaledVector(f.velocity, dt)
        f.velocity.multiplyScalar(0.985)
        f.mesh.rotation.x += f.angularVelocity.x * dt
        f.mesh.rotation.y += f.angularVelocity.y * dt
        ;(f.mesh.material as THREE.MeshBasicMaterial).opacity = Math.min(1, (1 - f.t) * 3)
      }
      if (f.t >= 1) {
        this.scene.remove(f.mesh)
        f.mesh.geometry.dispose()
        ;(f.mesh.material as THREE.Material).dispose()
        return false
      }
      return true
    })
  }

  /* -------------------- render loop -------------------- */

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.t += dt
    const sdt = dt * this.speed
    this.runQueue(sdt)
    this.updateFx(dt)

    this.rings.forEach((r, k) => {
      r.rotation.y += dt * (1.4 + k * 0.3)
    })
    this.atom.rotation.y += dt * 0.8
    this.atom.position.y = 0.98 + Math.sin(this.t * 2) * 0.03
    this.glow.material.opacity = (this.dark ? 0.5 : 0.4) + Math.sin(this.t * 2.2) * 0.08

    this.snakes.forEach((s, k) => {
      s.head.position.y = s.base + Math.sin(this.t * 2.4 + k) * 0.03
      s.tongue.scale.z = 0.6 + Math.abs(Math.sin(this.t * 6 + k)) * 0.8
    })

    const curStop = STOPS[this.state.stop]
    for (let i = 1; i <= 25; i++) {
      const tile = this.tiles[i]
      if (!tile.stop) continue
      tile.flash = Math.max(0, tile.flash - dt * 1.2)
      const idle = !this.busy && tile.stop === curStop ? 0.12 + Math.sin(this.t * 3) * 0.06 : 0
      tile.top.emissiveIntensity = Math.max(idle, tile.flash * 0.9)
    }

    const isB = this.cameraMode === "B"
    const tokenPos = this.token.position
    if (isB) {
      if (!this.fog) this.fog = new THREE.Fog(this.fogColor, 7, 18)
      this.fog.color.copy(this.fogColor)
      this.scene.fog = this.fog
    } else {
      this.scene.fog = null
    }

    const k = 1 - Math.exp(-dt * 3.2)
    let camera: THREE.Camera
    if (!isB) {
      camera = this.ortho
      const dir = new THREE.Vector3(1, 1.2, 1).normalize()
      const right = new THREE.Vector3(1, 0, -1).normalize()
      const forward = dir.clone().negate()
      const up = right.clone().cross(forward).normalize()
      const want = new THREE.Vector3(tokenPos.x * 0.18, 0.2, tokenPos.z * 0.18)
      want.addScaledVector(right, this.shiftX * this.viewH * this.asp).addScaledVector(up, this.shiftY * this.viewH)
      this.camTarget.lerp(want, k)
      camera.position.copy(this.camTarget).addScaledVector(dir, 30)
      camera.lookAt(this.camTarget)
    } else {
      camera = this.persp
      const off = this.narrow ? new THREE.Vector3(1.6, 4.2, 4.2) : new THREE.Vector3(2.0, 2.5, 3.1)
      const want = tokenPos.clone().add(new THREE.Vector3(0, 0.35, 0))
      this.camTarget.lerp(want, k)
      const wantPos = this.camTarget
        .clone()
        .add(off)
        .add(new THREE.Vector3(Math.sin(this.t * 0.4) * 0.15, 0, 0))
      if (!this.camPos) this.camPos = wantPos.clone()
      else this.camPos.lerp(wantPos, k)
      camera.position.copy(this.camPos)
      camera.lookAt(this.camTarget)
      camera.updateMatrixWorld()
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
      if (this.narrow) camera.lookAt(this.camTarget.clone().addScaledVector(up, -1.0))
      else camera.lookAt(this.camTarget.clone().addScaledVector(right, 1.1))
    }

    this.renderer.render(this.scene, camera)
  }

  setCamera(mode: CameraMode) {
    this.cameraMode = mode
    this.camPos = null
  }

  setSpeed(speed: number) {
    this.speed = clamp(speed, 0.5, 2)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro?.disconnect()
    this.reducedMotionQuery?.removeEventListener?.("change", this.onReducedMotionChange)
    if (!this.scene) return
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if ((mesh as THREE.Mesh).geometry) mesh.geometry.dispose()
      const material = (obj as THREE.Mesh).material
      if (Array.isArray(material)) material.forEach((m) => disposeMaterial(m))
      else if (material) disposeMaterial(material)
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

function disposeMaterial(material: THREE.Material) {
  const withMap = material as THREE.MeshStandardMaterial
  withMap.map?.dispose()
  ;(material as THREE.SpriteMaterial).map?.dispose()
  material.dispose()
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

export function useBoardScene(
  hostRef: RefObject<HTMLDivElement | null>,
  options: UseBoardSceneOptions,
): UseBoardSceneResult {
  const [state, setState] = useState<BoardSceneState>({
    stop: 0,
    sq: 1,
    moving: false,
    rolling: false,
    roll: null,
    statusText: "Tu turno",
    ready: false,
  })
  const [layout, setLayout] = useState<BoardSceneLayout>({
    narrow: false,
    rail: true,
    panelWidth: "min(520px, calc(100% - 32px))",
  })

  const sceneRef = useRef<BoardScene | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new BoardScene({
      host,
      dark: document.documentElement.classList.contains("dark"),
      camera: optionsRef.current.camera ?? "B",
      speed: optionsRef.current.speed ?? 1,
      confetti: optionsRef.current.confetti ?? true,
      onState: setState,
      onLayout: setLayout,
      onArrive: () => optionsRef.current.onArrive?.(),
    })
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef])

  // Follow the `dark` class on <html> instead of `options.dark`: next-themes toggles the class in
  // its own effect, which runs after this child's effects, so reading CSS variables on the
  // resolvedTheme change would still see the previous theme's values.
  useEffect(() => {
    const root = document.documentElement
    let applied = root.classList.contains("dark")
    const observer = new MutationObserver(() => {
      const dark = root.classList.contains("dark")
      if (dark === applied) return
      applied = dark
      sceneRef.current?.applyTheme(dark)
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (options.camera) sceneRef.current?.setCamera(options.camera)
  }, [options.camera])

  useEffect(() => {
    if (options.speed) sceneRef.current?.setSpeed(options.speed)
  }, [options.speed])

  const api = useMemo<BoardSceneApi>(
    () => ({
      forward: () => sceneRef.current?.forward(),
      back: () => sceneRef.current?.back(),
      goTo: (stopIndex: number) => sceneRef.current?.goTo(stopIndex),
      shortcut: (kind, index) => sceneRef.current?.shortcut(kind, index),
      isBusy: () => sceneRef.current?.isBusy() ?? false,
      getLockUntil: () => sceneRef.current?.getLockUntil() ?? 0,
    }),
    [],
  )

  return { api, state, layout }
}
