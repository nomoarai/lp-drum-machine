import { useRef, useEffect, type RefObject } from 'react'
import { countColorsWithCentroid } from '../lib/color'
import { COLOR_NAMES, type ColorName } from '../types'

const ANALYSIS_W = 320
const STRIP_HALF = 6

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  triggerRatio: number
  sensitivity: number
  cooldownMs: number
  running: boolean
  facingMode: string
  onTrigger: (color: ColorName) => void
}

export function useDetectionLoop(opts: Options) {
  const optsRef = useRef(opts)
  optsRef.current = opts

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const colStateRef = useRef(
    Object.fromEntries(COLOR_NAMES.map(n => [n, { inZone: false, lastMs: 0 }])) as Record<
      ColorName,
      { inZone: boolean; lastMs: number }
    >
  )
  const lastHitMsRef = useRef(0)
  const lastHitYRef = useRef(0.5)

  useEffect(() => {
    if (!opts.running) return

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }

    let animId = 0

    const tick = () => {
      const { videoRef, canvasRef, triggerRatio, sensitivity, cooldownMs, onTrigger } = optsRef.current
      const video = videoRef.current
      const canvas = canvasRef.current

      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        animId = requestAnimationFrame(tick)
        return
      }

      const { width: dw, height: dh } = canvas.getBoundingClientRect()
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw
        canvas.height = dh
      }

      const vw = video.videoWidth
      const vh = video.videoHeight

      const scale = Math.max(dw / vw, dh / vh)
      const cropW = dw / scale
      const cropH = dh / scale
      const sx = (vw - cropW) / 2
      const sy = (vh - cropH) / 2

      const off = offscreenRef.current!
      off.width = ANALYSIS_W
      off.height = Math.round(ANALYSIS_W * dh / dw)
      const offCtx = off.getContext('2d')!

      const shouldMirror = optsRef.current.facingMode !== 'environment'
      offCtx.save()
      if (shouldMirror) {
        offCtx.translate(off.width, 0)
        offCtx.scale(-1, 1)
      }
      offCtx.drawImage(video, sx, sy, cropW, cropH, 0, 0, off.width, off.height)
      offCtx.restore()

      const lx = Math.round(triggerRatio * off.width)
      const x0 = Math.max(0, lx - STRIP_HALF)
      const x1 = Math.min(off.width - 1, lx + STRIP_HALF)
      const stripW = x1 - x0 + 1
      const strip = offCtx.getImageData(x0, 0, stripW, off.height)
      const { counts, centroidY } = countColorsWithCentroid(strip.data, stripW, off.height)

      const nowMs = performance.now()
      for (const name of COLOR_NAMES) {
        const st = colStateRef.current[name]
        const detected = counts[name] >= sensitivity
        if (detected && !st.inZone && nowMs - st.lastMs > cooldownMs) {
          st.inZone = true
          st.lastMs = nowMs
          lastHitMsRef.current = nowMs
          lastHitYRef.current = centroidY[name]
          onTrigger(name)
        } else if (!detected) {
          st.inZone = false
        }
      }

      drawOverlay(canvas, triggerRatio, counts, sensitivity, nowMs - lastHitMsRef.current, lastHitYRef.current)

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [opts.running]) // eslint-disable-line react-hooks/exhaustive-deps
}

function drawOverlay(
  canvas: HTMLCanvasElement,
  triggerRatio: number,
  counts: Record<ColorName, number>,
  sensitivity: number,
  hitAgeMs: number,
  hitYRatio: number
) {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  const lx = triggerRatio * w
  const cx = w / 2
  const cy = h / 2

  // LP guide: outer record edge + inner label circle
  ctx.save()
  const lpR = Math.min(w, h) * 0.43
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 7])
  ctx.beginPath()
  ctx.arc(cx, cy, lpR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, lpR * 0.27, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Trigger line — bottom half, white
  const hitFade = Math.max(0, 1 - hitAgeMs / 260)
  const lineAlpha = 0.28 + hitFade * 0.55

  ctx.save()
  ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`
  ctx.lineWidth = hitFade > 0 ? 2.5 : 1.5
  ctx.setLineDash([10, 8])
  ctx.beginPath()
  ctx.moveTo(lx, h / 2)
  ctx.lineTo(lx, h)
  ctx.stroke()
  ctx.setLineDash([])

  // Handle dot
  ctx.fillStyle = `rgba(255,255,255,${0.5 + hitFade * 0.4})`
  ctx.beginPath()
  ctx.arc(lx, h / 2, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Hit flash: expanding ring burst at detected label position
  const hitY = hitYRatio * h
  if (hitFade > 0) {
    const progress = 1 - hitFade           // 0 → 1 as fade progresses
    const ringR = 12 + progress * 36
    ctx.save()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5 * hitFade
    ctx.globalAlpha = hitFade * 0.9
    ctx.beginPath()
    ctx.arc(lx, hitY, ringR, 0, Math.PI * 2)
    ctx.stroke()
    // Inner fill flash
    ctx.globalAlpha = hitFade * 0.18
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.restore()

    // Vertical flash line — brief full-height streak
    if (hitFade > 0.6) {
      const streakAlpha = (hitFade - 0.6) / 0.4
      ctx.save()
      ctx.globalAlpha = streakAlpha * 0.35
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(lx - 1, 0, 2, h)
      ctx.restore()
    }
  }

  // Mini level meters — white
  COLOR_NAMES.forEach((name, i) => {
    const fill = Math.min(1, counts[name] / Math.max(1, sensitivity * 2.5))
    const bx = lx + 16
    const by = 18 + i * 24

    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.globalAlpha = fill > 0.25 ? 0.7 : 0.15
    ctx.fillRect(bx, by, fill * 52, 8)
    ctx.globalAlpha = 0.35
    ctx.font = '8px monospace'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(name.toUpperCase(), bx + 58, by + 7)
    ctx.restore()
  })
}
