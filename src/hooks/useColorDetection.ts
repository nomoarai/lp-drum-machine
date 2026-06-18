import { useRef, useEffect, useCallback } from 'react'
import { countColorsWithCentroid } from '../lib/color'
import { COLOR_NAMES, type ColorName } from '../types'

const ANALYSIS_W = 320
const STRIP_HALF = 6

interface DetectionState {
  inZone: boolean
  lastMs: number
}

interface Options {
  videoEl: HTMLVideoElement | null
  canvasEl: HTMLCanvasElement | null
  triggerRatio: number
  sensitivity: number
  cooldownMs: number
  running: boolean
  onTrigger: (color: ColorName) => void
  onFrame: (counts: Record<ColorName, number>) => void
}

export function useColorDetection(opts: Options) {
  const optsRef = useRef(opts)
  optsRef.current = opts

  const stateRef = useRef<Record<ColorName, DetectionState>>({
    red:    { inZone: false, lastMs: 0 },
    blue:   { inZone: false, lastMs: 0 },
    yellow: { inZone: false, lastMs: 0 },
    green:  { inZone: false, lastMs: 0 },
  })

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number>(0)

  const getOffscreen = useCallback(() => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas')
    }
    return offscreenRef.current
  }, [])

  useEffect(() => {
    if (!opts.running) {
      cancelAnimationFrame(animRef.current)
      return
    }

    const tick = () => {
      const { videoEl, canvasEl, triggerRatio, sensitivity, cooldownMs, onTrigger, onFrame } = optsRef.current

      if (!videoEl || !canvasEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
        animRef.current = requestAnimationFrame(tick)
        return
      }

      // Fit canvas to its CSS size
      const rect = canvasEl.getBoundingClientRect()
      if (canvasEl.width !== rect.width || canvasEl.height !== rect.height) {
        canvasEl.width = rect.width
        canvasEl.height = rect.height
      }

      const dw = canvasEl.width
      const dh = canvasEl.height
      const vw = videoEl.videoWidth
      const vh = videoEl.videoHeight

      // object-fit: cover crop
      const scale = Math.max(dw / vw, dh / vh)
      const cropW = dw / scale
      const cropH = dh / scale
      const sx = (vw - cropW) / 2
      const sy = (vh - cropH) / 2

      const off = getOffscreen()
      off.width = ANALYSIS_W
      off.height = Math.round(ANALYSIS_W * dh / dw)
      const offCtx = off.getContext('2d')!
      offCtx.drawImage(videoEl, sx, sy, cropW, cropH, 0, 0, off.width, off.height)

      const lx = Math.round(triggerRatio * off.width)
      const x0 = Math.max(0, lx - STRIP_HALF)
      const x1 = Math.min(off.width - 1, lx + STRIP_HALF)
      const stripW = x1 - x0 + 1
      const strip = offCtx.getImageData(x0, 0, stripW, off.height)
      const { counts } = countColorsWithCentroid(strip.data, stripW, off.height)

      onFrame(counts)

      const nowMs = performance.now()
      for (const name of COLOR_NAMES) {
        const st = stateRef.current[name]
        const detected = counts[name] >= sensitivity

        if (detected && !st.inZone && nowMs - st.lastMs > cooldownMs) {
          st.inZone = true
          st.lastMs = nowMs
          onTrigger(name)
        } else if (!detected) {
          st.inZone = false
        }
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [opts.running, getOffscreen])
}
