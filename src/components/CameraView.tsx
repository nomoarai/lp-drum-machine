import { useRef, useEffect, type RefObject } from 'react'

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  running: boolean
  status: string
  triggerRatio: number
  onRatioChange: (r: number) => void
}

export function CameraView({ videoRef, canvasRef, running, status, triggerRatio, onRatioChange }: Props) {
  const dragRef = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const moveTrigger = (clientX: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    onRatioChange(Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width)))
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (dragRef.current) moveTrigger(e.clientX) }
    const onMouseUp = () => { dragRef.current = false }
    const onTouchMove = (e: TouchEvent) => { if (dragRef.current && e.touches[0]) moveTrigger(e.touches[0].clientX) }
    const onTouchEnd = () => { dragRef.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrapRef} className="relative flex-1 overflow-hidden" style={{ background: '#111' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Invisible drag handle */}
      <div
        className="absolute top-0 h-full w-12 cursor-ew-resize touch-none z-10"
        style={{ left: `${triggerRatio * 100}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => { dragRef.current = true }}
        onTouchStart={(e) => { e.preventDefault(); dragRef.current = true }}
      />

      {(!running || status) && (
        <p
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-widest whitespace-nowrap pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {status || '▶ 시작 버튼을 누르세요'}
        </p>
      )}
    </div>
  )
}
