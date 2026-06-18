import { useState, useCallback, useRef } from 'react'
import { CameraView } from './components/CameraView'
import { Indicators } from './components/Indicators'
import { Controls } from './components/Controls'
import { useCamera } from './hooks/useCamera'
import { useAudio } from './hooks/useAudio'
import { useDetectionLoop } from './hooks/useDetectionLoop'
import { useRecorder } from './hooks/useRecorder'
import { COLOR_NAMES, type ColorName } from './types'

const emptyActive = () =>
  Object.fromEntries(COLOR_NAMES.map(n => [n, false])) as Record<ColorName, boolean>

export default function App() {
  const [triggerRatio, setTriggerRatio] = useState(0.5)
  const [sensitivity, setSensitivity] = useState(12)
  const [cooldownMs, setCooldownMs] = useState(380)
  const [bpm, setBpm] = useState<number | null>(null)
  const [active, setActive] = useState<Record<ColorName, boolean>>(emptyActive)
  const [status, setStatus] = useState('')
  const [reverb, setReverbState] = useState(0)
  const [delay, setDelayState] = useState(0)
  const [delayBpm, setDelayBpmState] = useState(120)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { running, error, facingMode, start, stop } = useCamera(videoRef)
  const { trigger, setReverb, setDelay, setDelayTime, initAudio, audioStream } = useAudio()
  const { recording, start: startRecording, stop: stopRecording, blobUrl } = useRecorder(canvasRef, audioStream)

  const handleTrigger = useCallback((color: ColorName) => {
    const newBpm = trigger(color)
    if (newBpm) setBpm(newBpm)
    setActive(prev => ({ ...prev, [color]: true }))
    setTimeout(() => setActive(prev => ({ ...prev, [color]: false })), 180)
  }, [trigger])

  useDetectionLoop({
    videoRef,
    canvasRef,
    triggerRatio,
    sensitivity,
    cooldownMs,
    running,
    facingMode,
    onTrigger: handleTrigger,
  })

  const handleStart = useCallback(async () => {
    await initAudio()
    await start()
    setStatus('트리거 라인에 라벨지를 통과시키세요')
    setTimeout(() => setStatus(''), 4000)
  }, [start, initAudio])

  const handleStop = useCallback(() => {
    stop()
    setBpm(null)
    setStatus('')
    const canvas = canvasRef.current
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }, [stop])

  const handleTest = useCallback((color: ColorName) => {
    trigger(color)
    setActive(prev => ({ ...prev, [color]: true }))
    setTimeout(() => setActive(prev => ({ ...prev, [color]: false })), 180)
  }, [trigger])

  const handleReverbChange = useCallback((v: number) => {
    setReverbState(v)
    setReverb(v / 100)
  }, [setReverb])

  const handleDelayChange = useCallback((v: number) => {
    setDelayState(v)
    setDelay(v / 100)
  }, [setDelay])

  const handleDelayBpmChange = useCallback((v: number) => {
    setDelayBpmState(v)
    setDelayTime(v)
  }, [setDelayTime])

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#080808', fontFamily: 'monospace' }}
    >
      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        running={running}
        status={error ?? status}
        triggerRatio={triggerRatio}
        facingMode={facingMode}
        onRatioChange={setTriggerRatio}
      />

      <div
        className="shrink-0 px-3.5 pt-2.5 pb-4"
        style={{ background: '#0c0c0c', borderTop: '1px solid #1c1c1c' }}
      >
        <Indicators active={active} onTest={handleTest} />
        <Controls
          running={running}
          sensitivity={sensitivity}
          cooldownMs={cooldownMs}
          bpm={bpm}
          reverb={reverb}
          delay={delay}
          delayBpm={delayBpm}
          recording={recording}
          blobUrl={blobUrl}
          onStart={handleStart}
          onStop={handleStop}
          onSensitivityChange={setSensitivity}
          onCooldownChange={setCooldownMs}
          onReverbChange={handleReverbChange}
          onDelayChange={handleDelayChange}
          onDelayBpmChange={handleDelayBpmChange}
          onRecordStart={startRecording}
          onRecordStop={stopRecording}
        />
      </div>
    </div>
  )
}
