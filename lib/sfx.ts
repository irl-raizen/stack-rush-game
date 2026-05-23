/**
 * Tiny WebAudio SFX engine (no external assets).
 *
 * - Lazy-initialized on first user gesture to satisfy autoplay policies.
 * - Procedurally generates short tones / noise bursts so every sound stays
 *   perfectly in sync with input events (zero network + decode latency).
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.28
    master.connect(ctx.destination)
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {})
  }
  return ctx
}

function tone(
  freq: number,
  duration: number,
  opts: { type?: OscillatorType; vol?: number; delay?: number; sweepTo?: number } = {},
) {
  const c = ensureCtx()
  if (!c || !master || muted) return
  const t = c.currentTime + (opts.delay ?? 0)
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = opts.type ?? "triangle"
  osc.frequency.setValueAtTime(freq, t)
  if (opts.sweepTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.sweepTo), t + duration)
  }
  const vol = opts.vol ?? 0.25
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

function noise(
  duration: number,
  opts: { vol?: number; delay?: number; band?: { freq: number; q: number } } = {},
) {
  const c = ensureCtx()
  if (!c || !master || muted) return
  const t = c.currentTime + (opts.delay ?? 0)
  const len = Math.max(1, Math.floor(c.sampleRate * duration))
  const buffer = c.createBuffer(1, len, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const gain = c.createGain()
  const vol = opts.vol ?? 0.15
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  let last: AudioNode = src
  if (opts.band) {
    const bp = c.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = opts.band.freq
    bp.Q.value = opts.band.q
    src.connect(bp)
    last = bp
  }
  last.connect(gain).connect(master)
  src.start(t)
  src.stop(t + duration + 0.02)
}

export const sfx = {
  unlock() {
    ensureCtx()
  },
  setMuted(v: boolean) {
    muted = v
  },
  isMuted() {
    return muted
  },
  /** Short "thud" when a block lands (pitch rises with combo). */
  drop(combo = 0) {
    const base = 180 + Math.min(14, combo) * 16
    tone(base * 1.9, 0.13, { type: "triangle", vol: 0.22, sweepTo: base })
    noise(0.05, { vol: 0.07, band: { freq: 700, q: 1.6 } })
  },
  /** Bright arpeggio for a perfect drop, pitched by combo. */
  perfect(combo = 1) {
    const step = Math.min(8, Math.max(0, combo - 1))
    const root = 620 * Math.pow(2, step / 12)
    tone(root, 0.16, { type: "triangle", vol: 0.22, delay: 0 })
    tone(root * 1.26, 0.18, { type: "triangle", vol: 0.18, delay: 0.04 })
    tone(root * 1.5, 0.22, { type: "triangle", vol: 0.2, delay: 0.09 })
    noise(0.08, { vol: 0.06, band: { freq: 4200, q: 1 } })
  },
  /** Coin pickup blip. */
  coin() {
    tone(1080, 0.05, { type: "square", vol: 0.1 })
    tone(1620, 0.08, { type: "square", vol: 0.08, delay: 0.04 })
  },
  /** Low descending crash for game over. */
  gameOver() {
    tone(520, 0.6, { type: "sawtooth", vol: 0.28, sweepTo: 70 })
    noise(0.35, { vol: 0.16, delay: 0.04, band: { freq: 180, q: 0.7 } })
    tone(140, 0.5, { type: "sine", vol: 0.18, delay: 0.08, sweepTo: 40 })
  },
  /** Light UI click. */
  ui() {
    tone(420, 0.05, { type: "square", vol: 0.1 })
  },
  /** Whoosh for a near-miss — creates the "one more try" feeling. */
  nearMiss() {
    noise(0.28, { vol: 0.14, band: { freq: 900, q: 0.9 } })
    tone(280, 0.2, { type: "sine", vol: 0.12, sweepTo: 140 })
  },
  /** Short stinger layered on perfect to emphasize multiplier jumps. */
  multiplier(tier: 2 | 3 | 5) {
    const root = tier === 5 ? 920 : tier === 3 ? 760 : 640
    tone(root, 0.12, { type: "triangle", vol: 0.18 })
    tone(root * 1.5, 0.18, { type: "triangle", vol: 0.16, delay: 0.05 })
    if (tier >= 3) tone(root * 2, 0.22, { type: "triangle", vol: 0.14, delay: 0.1 })
    if (tier === 5) noise(0.12, { vol: 0.08, band: { freq: 6000, q: 0.8 }, delay: 0.04 })
  },
  /** Bonus jingle for claiming a daily / welcome reward. */
  reward() {
    tone(660, 0.12, { type: "triangle", vol: 0.18 })
    tone(880, 0.14, { type: "triangle", vol: 0.18, delay: 0.1 })
    tone(1320, 0.2, { type: "triangle", vol: 0.18, delay: 0.22 })
  },
}
