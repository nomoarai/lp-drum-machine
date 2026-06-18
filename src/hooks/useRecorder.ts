import { useRef, useCallback, useState, type RefObject } from 'react'

export function useRecorder(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  audioStream: MediaStream | null
) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const start = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (blobUrl) URL.revokeObjectURL(blobUrl)
    setBlobUrl(null)
    chunksRef.current = []

    const videoStream = canvas.captureStream(30)
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()]
    if (audioStream) {
      const at = audioStream.getAudioTracks()
      if (at.length > 0) tracks.push(at[0])
    }
    const combined = new MediaStream(tracks)

    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      '',
    ].find(t => !t || MediaRecorder.isTypeSupported(t)) ?? ''

    const opts = mimeType ? { mimeType } : undefined
    const recorder = new MediaRecorder(combined, opts)
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' })
      setBlobUrl(URL.createObjectURL(blob))
    }
    recorder.start()
    recorderRef.current = recorder
    setRecording(true)
  }, [canvasRef, audioStream, blobUrl])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
  }, [])

  return { recording, start, stop, blobUrl }
}
