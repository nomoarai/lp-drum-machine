import { useRef, useEffect, type RefObject } from 'react'
import { COLOR_DEFS, COLOR_NAMES, type ColorName } from '../types'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>
  triggerRatio: number
  counts: Record<ColorName, number>
  sensitivity: number
  onRatioChange: (ratio: number) => void
}

export function TriggerLine({ canvasRef, triggerRatio, counts, sensitivity, onRatioChange }: Props) {
  const dragRef = useRef(false)

  // Draw overlay on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const lx = triggerRatio * canvas.width
    const h = canvas.height

    // Dashed trigger line
    ctx.save()
    ctx.strokeStyle = 'rgba(0,229,255,0.5)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 8])
    ctx.beginPath()
    ctx.moveTo(lx, 0)
    ctx.lineTo(lx, h)
    ctx.stroke()
    ctx.setLineDash([])

    // Centre handle
    ctx.fillStyle = 'rgba(0,229,255,0.9)'
    ctx.beginPath()
    ctx.arc(lx, h / 2, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Mini level meters
    COLOR_NAMES.forEach((name, i) => {
      const fill = Math.min(1, counts[name] / Math.max(1, sensitivity * 2.5))
      const bx = lx + 16
      const by = 18 + i * 24
      const color = COLOR_DEFS[name].css

      ctx.save()
      ctx.fillStyle = color
      ctx.globalAlpha = fill > 0.25 ? 0.85 : 0.2
      ctx.fillRect(bx, by, fill * 52, 9)
      ctx.globalAlpha = 0.55
      ctx.font = '8px monospace'
      ctx.fillStyle = color
      ctx.fillText(name.toUpperCase(), bx + 58, by + 8)
      ctx.restore()
    })
  })

  const moveTrigger = (clientX: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width))
    onRatioChange(ratio)
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragRef.current) moveTrigger(e.clientX) }
    const onMouseUp = () => { dragRef.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (dragRef.current && e.touches[0]) moveTrigger(e.touches[0].clientX)
    }
    const onTouchEnd = () => { dragRef.current = false }
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="absolute top-0 h-full w-12 cursor-ew-resize touch-none z-10"
      style={{ left: `${triggerRatio * 100}%`, transform: 'translateX(-50%)' }}
      onMouseDown={() => { dragRef.current = true }}
      onTouchStart={(e) => { e.preventDefault(); dragRef.current = true }}
    />
  )
}
