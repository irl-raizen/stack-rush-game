/**
 * Stack Rush: Perfect Tower — Core Game Engine
 *
 * Pure game logic, independent of React/DOM. Drives a requestAnimationFrame loop
 * via the `update(dt)` and `draw(ctx)` methods. Accepts taps/clicks via `drop()`.
 *
 * Feel / retention layer:
 *  - Trauma-based screen shake, ease-out.
 *  - Per-block settle squash/stretch after placement.
 *  - Tumbling debris for sliced overhangs.
 *  - Expanding ring + sparkle shards on perfect drops.
 *  - Combo multiplier tiers (2x / 3x / 5x) on top of linear combo bonus.
 *  - Difficulty curve: speed ramps every 5 stacks; after 10 stacks speed gets
 *    slight randomness on each bounce; after 20 stacks a subtle micro-jitter
 *    is added so movement stops feeling predictable.
 *  - Near-miss detection drives the UI slow-mo juice.
 */

import type { SkinId } from "./skins"
import { getBlockColor } from "./skins"

export interface Block {
  x: number
  y: number
  width: number
  height: number
  color: string
  /** 0 → idle, 1 → just landed. Decays over ~420ms for squash animation. */
  settle: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  angle?: number
  angVel?: number
  w?: number
  h?: number
}

export interface Debris {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  angle: number
  angVel: number
  color: string
  life: number
  maxLife: number
}

export interface Ring {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  color: string
}

export interface DropResult {
  kind: "perfect" | "good" | "gameover"
  score: number
  combo: number
  multiplier: 1 | 2 | 3 | 5
  /** True for cuts where the player was within ~12px but missed perfect. */
  nearMiss: boolean
  coinsEarned: number
  totalCoins: number
  scoreGain: number
}

export interface EngineConfig {
  width: number
  height: number
  skin: SkinId
  onDrop?: (result: DropResult) => void
  onGameOver?: (finalScore: number, coinsEarned: number, bestCombo: number) => void
}

const BLOCK_HEIGHT = 28
const INITIAL_WIDTH = 180
const INITIAL_SPEED = 2.2
const SPEED_INCREMENT = 0.14
const PERFECT_THRESHOLD = 4 // px
const NEAR_MISS_THRESHOLD = 12 // px — used by UI for slow-mo feedback
const CAMERA_TARGET_Y_RATIO = 0.55
const SETTLE_DECAY_PER_MS = 1 / 420

/** Combo → multiplier tier for perfect-chain scoring. */
export function multiplierForCombo(combo: number): 1 | 2 | 3 | 5 {
  if (combo >= 10) return 5
  if (combo >= 5) return 3
  if (combo >= 3) return 2
  return 1
}

export class StackGameEngine {
  cfg: EngineConfig
  blocks: Block[] = []
  currentBlock: Block
  direction: 1 | -1 = 1
  speed: number = INITIAL_SPEED
  score = 0
  combo = 0
  bestCombo = 0
  coinsEarned = 0
  cameraY = 0
  targetCameraY = 0
  gameOver = false

  // Difficulty / movement state.
  /** After 20+ stacks we add a sinusoidal micro-jitter on top of the base drift. */
  private jitterPhase = 0

  // Juice state.
  particles: Particle[] = []
  debris: Debris[] = []
  rings: Ring[] = []
  trauma = 0
  perfectFlash = 0
  comboGlow = 0

  constructor(cfg: EngineConfig) {
    this.cfg = cfg
    this.currentBlock = this.makeCurrentBlock(INITIAL_WIDTH, 0)
    this.blocks.push({
      x: (cfg.width - INITIAL_WIDTH) / 2,
      y: cfg.height - BLOCK_HEIGHT,
      width: INITIAL_WIDTH,
      height: BLOCK_HEIGHT,
      color: getBlockColor(cfg.skin, 0),
      settle: 0,
    })
  }

  private makeCurrentBlock(width: number, forIndex: number): Block {
    const startFromLeft = forIndex % 2 === 0
    this.direction = startFromLeft ? 1 : -1
    const y =
      this.cfg.height -
      BLOCK_HEIGHT * 2 -
      (this.blocks.length > 0
        ? this.cfg.height - this.blocks[this.blocks.length - 1].y - BLOCK_HEIGHT
        : 0)
    return {
      x: startFromLeft ? -width + 8 : this.cfg.width - 8,
      y,
      width,
      height: BLOCK_HEIGHT,
      color: getBlockColor(this.cfg.skin, this.blocks.length + 1),
      settle: 0,
    }
  }

  /** Advance physics by `dt` milliseconds. */
  update(dt: number) {
    // Frame-rate independent camera ease.
    const cameraEase = 1 - Math.exp(-dt * 0.012)
    this.cameraY += (this.targetCameraY - this.cameraY) * cameraEase

    if (this.gameOver) {
      this.updateEffects(dt)
      return
    }

    const frames = dt / 16.6667

    // Difficulty: add micro-jitter to the moving block after 20+ stacks.
    const stacks = this.blocks.length
    let jitter = 0
    if (stacks >= 20) {
      this.jitterPhase += dt * 0.008
      const intensity = Math.min(0.6, (stacks - 20) * 0.015)
      jitter = Math.sin(this.jitterPhase) * intensity
    }

    this.currentBlock.x += (this.direction * this.speed + jitter) * frames

    // Bounce off walls, with a tiny speed randomness at higher levels to keep
    // the player reading each pass instead of memorizing timing.
    if (this.currentBlock.x + this.currentBlock.width > this.cfg.width) {
      this.currentBlock.x = this.cfg.width - this.currentBlock.width
      this.direction = -1
      this.applyBounceRandomness()
    } else if (this.currentBlock.x < 0) {
      this.currentBlock.x = 0
      this.direction = 1
      this.applyBounceRandomness()
    }

    this.updateEffects(dt)
  }

  private applyBounceRandomness() {
    const stacks = this.blocks.length
    if (stacks < 10) return
    // Up to ±8% wobble on the base speed, reset to the trend each bounce.
    const baseSpeed = INITIAL_SPEED + Math.floor(stacks / 5) * SPEED_INCREMENT
    const wobble = (Math.random() - 0.5) * 0.16 * baseSpeed
    this.speed = Math.max(1.4, baseSpeed + wobble)
  }

  private updateEffects(dt: number) {
    const frames = dt / 16.6667

    if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - dt * 0.0045)
    if (this.perfectFlash > 0) this.perfectFlash = Math.max(0, this.perfectFlash - dt / 260)
    if (this.comboGlow > 0) this.comboGlow = Math.max(0, this.comboGlow - dt / 700)

    for (const b of this.blocks) {
      if (b.settle > 0) b.settle = Math.max(0, b.settle - dt * SETTLE_DECAY_PER_MS)
    }

    for (const p of this.particles) {
      p.x += p.vx * frames
      p.y += p.vy * frames
      p.vy += 0.28 * frames
      if (p.angle !== undefined && p.angVel !== undefined) p.angle += p.angVel * frames
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)

    for (const d of this.debris) {
      d.x += d.vx * frames
      d.y += d.vy * frames
      d.vy += 0.55 * frames
      d.angle += d.angVel * frames
      d.life -= dt
    }
    this.debris = this.debris.filter(
      (d) => d.life > 0 && d.y < this.cfg.height - this.cameraY + 400,
    )

    for (const r of this.rings) {
      const t = 1 - r.life / r.maxLife
      r.radius = r.maxRadius * easeOutCubic(t)
      r.life -= dt
    }
    this.rings = this.rings.filter((r) => r.life > 0)
  }

  /** Called when the user taps/clicks. */
  drop(): DropResult | null {
    if (this.gameOver) return null

    const top = this.blocks[this.blocks.length - 1]
    const cur = this.currentBlock

    const leftOverlap = Math.max(cur.x, top.x)
    const rightOverlap = Math.min(cur.x + cur.width, top.x + top.width)
    const overlap = rightOverlap - leftOverlap

    if (overlap <= 0) {
      this.gameOver = true
      this.trauma = Math.min(1, this.trauma + 0.85)
      this.spawnDebris(cur.x, cur.y, cur.width, cur.height, cur.color, this.direction, true)
      this.spawnParticles(cur.x + cur.width / 2, cur.y + cur.height / 2, cur.color, 22, "burst")
      this.spawnGroundDust(top.y)
      this.cfg.onGameOver?.(this.score, this.coinsEarned, this.bestCombo)
      return {
        kind: "gameover",
        score: this.score,
        combo: this.combo,
        multiplier: 1,
        nearMiss: false,
        coinsEarned: 0,
        totalCoins: this.coinsEarned,
        scoreGain: 0,
      }
    }

    const diff = Math.abs(cur.x - top.x)
    let placedWidth = overlap
    let kind: "perfect" | "good" = "good"
    let nearMiss = false

    if (diff <= PERFECT_THRESHOLD) {
      placedWidth = top.width
      kind = "perfect"
      this.combo++
      this.bestCombo = Math.max(this.bestCombo, this.combo)
      this.perfectFlash = 1
      this.comboGlow = Math.min(1, 0.5 + this.combo * 0.08)
      const cx = cur.x + cur.width / 2
      const cy = cur.y + cur.height / 2
      this.spawnParticles(cx, cy, cur.color, 16, "sparkle")
      // Ring size scales with multiplier tier so 5x feels explosive.
      const mult = multiplierForCombo(this.combo)
      const ringSize = 140 + Math.min(80, this.combo * 10) + (mult - 1) * 30
      this.spawnRing(cx, cy, cur.color, ringSize)
      // Secondary ring on high multipliers.
      if (mult >= 3) this.spawnRing(cx, cy, "#ffffff", ringSize * 0.6)
    } else {
      this.combo = 0
      this.comboGlow = 0
      nearMiss = diff <= NEAR_MISS_THRESHOLD
      if (cur.x < top.x) {
        const overW = top.x - cur.x
        this.spawnDebris(cur.x, cur.y, overW, cur.height, cur.color, -1, false)
      } else {
        const overW = cur.x + cur.width - (top.x + top.width)
        const overX = top.x + top.width
        this.spawnDebris(overX, cur.y, overW, cur.height, cur.color, 1, false)
      }
    }

    // Snap placed block.
    const placedX = kind === "perfect" ? top.x : leftOverlap
    const placed: Block = {
      x: placedX,
      y: top.y - BLOCK_HEIGHT,
      width: placedWidth,
      height: BLOCK_HEIGHT,
      color: cur.color,
      settle: 1,
    }
    this.blocks.push(placed)

    // Scoring with multiplier tiers.
    const multiplier = kind === "perfect" ? multiplierForCombo(this.combo) : 1
    const base = kind === "perfect" ? 10 : 5
    const comboBonus = this.combo > 1 ? this.combo * 2 : 0
    const scoreGain = (base + comboBonus) * multiplier
    this.score += scoreGain

    const coinBase = kind === "perfect" ? 3 : 1
    const coins = coinBase * multiplier
    this.coinsEarned += coins

    // Speed ramp every 5 stacks.
    if (this.blocks.length % 5 === 0) {
      this.speed += SPEED_INCREMENT
    }

    // Trauma — scaled by multiplier on perfect, heavy on cut.
    if (kind === "perfect") {
      this.trauma = Math.min(1, this.trauma + 0.14 + (multiplier - 1) * 0.04)
    } else {
      this.trauma = Math.min(1, this.trauma + 0.32)
    }

    // Next block.
    const nextIndex = this.blocks.length
    const nextWidth = placedWidth
    const startFromLeft = nextIndex % 2 === 0
    this.direction = startFromLeft ? 1 : -1
    this.currentBlock = {
      x: startFromLeft ? -nextWidth + 8 : this.cfg.width - 8,
      y: placed.y - BLOCK_HEIGHT,
      width: nextWidth,
      height: BLOCK_HEIGHT,
      color: getBlockColor(this.cfg.skin, nextIndex),
      settle: 0,
    }

    const desiredOnScreenY = this.cfg.height * CAMERA_TARGET_Y_RATIO
    this.targetCameraY = Math.min(0, this.currentBlock.y - desiredOnScreenY)

    const result: DropResult = {
      kind,
      score: this.score,
      combo: this.combo,
      multiplier,
      nearMiss,
      coinsEarned: coins,
      totalCoins: this.coinsEarned,
      scoreGain,
    }
    this.cfg.onDrop?.(result)
    return result
  }

  private spawnParticles(
    x: number,
    y: number,
    color: string,
    count: number,
    style: "burst" | "sparkle",
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (style === "sparkle" ? 1.5 : 2) + Math.random() * 4
      const asShard = style === "burst" && Math.random() < 0.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (style === "sparkle" ? 2.4 : 1.6),
        life: (style === "sparkle" ? 700 : 600) + Math.random() * 400,
        maxLife: 1000,
        color: style === "sparkle" ? "#ffffff" : color,
        size: style === "sparkle" ? 1.4 + Math.random() * 1.8 : 2 + Math.random() * 3,
        angle: asShard ? Math.random() * Math.PI * 2 : undefined,
        angVel: asShard ? (Math.random() - 0.5) * 0.3 : undefined,
        w: asShard ? 3 + Math.random() * 4 : undefined,
        h: asShard ? 2 + Math.random() * 3 : undefined,
      })
    }
  }

  private spawnDebris(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    dir: 1 | -1,
    heavy: boolean,
  ) {
    if (w <= 0) return
    this.debris.push({
      x,
      y,
      w,
      h,
      vx: dir * (heavy ? 3.2 : 2.4) + (Math.random() - 0.5) * 0.8,
      vy: heavy ? -3.2 : -2.2,
      angle: 0,
      angVel: dir * (0.08 + Math.random() * 0.1),
      color,
      life: 2000,
      maxLife: 2000,
    })
  }

  private spawnRing(x: number, y: number, color: string, maxRadius: number) {
    this.rings.push({
      x,
      y,
      radius: 0,
      maxRadius,
      life: 520,
      maxLife: 520,
      color,
    })
  }

  private spawnGroundDust(groundY: number) {
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * this.cfg.width
      this.particles.push({
        x,
        y: groundY,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 2,
        life: 900 + Math.random() * 600,
        maxLife: 1500,
        color: "#cbd5e1",
        size: 1.5 + Math.random() * 2.5,
      })
    }
  }

  /** Render to a 2D canvas context. */
  draw(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.cfg

    ctx.clearRect(0, 0, width, height)

    const shakeMag = this.trauma * this.trauma * 16
    const shakeX = (Math.random() - 0.5) * shakeMag
    const shakeY = (Math.random() - 0.5) * shakeMag

    ctx.save()
    ctx.translate(shakeX, shakeY - this.cameraY)

    const base = this.blocks[0]
    if (base) {
      const gy = base.y + base.height
      const grd = ctx.createLinearGradient(0, gy, 0, gy + 120)
      grd.addColorStop(0, "rgba(255,255,255,0.06)")
      grd.addColorStop(1, "rgba(255,255,255,0)")
      ctx.fillStyle = grd
      ctx.fillRect(0, gy, width, 120)
    }

    for (const b of this.blocks) {
      this.drawBlock(ctx, b, false)
    }

    for (const d of this.debris) {
      const alpha = Math.min(1, d.life / 500)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(d.x + d.w / 2, d.y + d.h / 2)
      ctx.rotate(d.angle)
      ctx.fillStyle = this.darken(d.color, 0.08)
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h)
      ctx.fillStyle = "rgba(255,255,255,0.2)"
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, 2)
      ctx.restore()
    }
    ctx.globalAlpha = 1

    if (!this.gameOver) {
      if (this.comboGlow > 0) {
        const c = this.currentBlock
        const cx = c.x + c.width / 2
        const cy = c.y + c.height / 2
        const rad = c.width * 0.9
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
        glow.addColorStop(0, hexToRgba(c.color, 0.35 * this.comboGlow))
        glow.addColorStop(1, hexToRgba(c.color, 0))
        ctx.fillStyle = glow
        ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
      }
      this.drawBlock(ctx, this.currentBlock, true)
    }

    for (const r of this.rings) {
      const t = 1 - r.life / r.maxLife
      const alpha = (1 - t) * 0.6
      ctx.strokeStyle = hexToRgba(r.color, alpha)
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2)
      ctx.stroke()
    }

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.globalAlpha = alpha
      if (p.w && p.h && p.angle !== undefined) {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1

    ctx.restore()

    if (this.perfectFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.perfectFlash * 0.14})`
      ctx.fillRect(0, 0, width, height)
    }
  }

  private drawBlock(ctx: CanvasRenderingContext2D, b: Block, isCurrent: boolean) {
    let sx = 1
    let sy = 1
    if (b.settle > 0) {
      const age = 1 - b.settle
      const damp = Math.exp(-age * 5)
      const wave = Math.cos(age * Math.PI * 3)
      const amt = damp * wave * 0.16
      sy = 1 - amt
      sx = 1 + amt * 0.55
    }

    const cx = b.x + b.width / 2
    const baseY = b.y + b.height

    ctx.save()
    ctx.translate(cx, baseY)
    ctx.scale(sx, sy)

    const w = b.width
    const h = b.height
    const left = -w / 2
    const top = -h

    ctx.fillStyle = "rgba(0,0,0,0.25)"
    ctx.fillRect(left + 2, top + 3, w, h)

    const grad = ctx.createLinearGradient(0, top, 0, top + h)
    grad.addColorStop(0, this.lighten(b.color, 0.18))
    grad.addColorStop(1, this.darken(b.color, 0.12))
    ctx.fillStyle = grad
    ctx.fillRect(left, top, w, h)

    ctx.fillStyle = "rgba(255,255,255,0.22)"
    ctx.fillRect(left, top, w, 3)

    if (isCurrent && this.comboGlow > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${0.4 * this.comboGlow})`
      ctx.lineWidth = 2
      ctx.strokeRect(left - 1, top - 1, w + 2, h + 2)
    }

    ctx.restore()
  }

  private lighten(hex: string, amt: number) {
    return this.shade(hex, amt)
  }
  private darken(hex: string, amt: number) {
    return this.shade(hex, -amt)
  }
  private shade(hex: string, amt: number) {
    const h = hex.replace("#", "")
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    const adj = (c: number) => {
      const v = Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))
      return Math.max(0, Math.min(255, v))
    }
    const rr = adj(r).toString(16).padStart(2, "0")
    const gg = adj(g).toString(16).padStart(2, "0")
    const bb = adj(b).toString(16).padStart(2, "0")
    return `#${rr}${gg}${bb}`
  }
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "")
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
