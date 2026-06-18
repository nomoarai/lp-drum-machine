import { useRef, useCallback, useState, type RefObject } from 'react'

export function useCamera(videoRef: RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState('')

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
        },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()

      let fm = ''
      try { fm = stream.getVideoTracks()[0]?.getSettings()?.facingMode ?? '' } catch { /* noop */ }
      setFacingMode(fm)
      setRunning(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '카메라 오류')
    }
  }, [videoRef])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
    setFacingMode('')
    setRunning(false)
  }, [videoRef])

  return { running, error, facingMode, start, stop }
}
