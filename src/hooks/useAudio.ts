import { useRef, useCallback, useState } from 'react'
import { playKick, playSnare, playChimeBell, playDeepTom, createImpulseReverb } from '../lib/sounds'
import type { ColorName } from '../types'

interface EffectBus {
  input: GainNode
  reverbWet: GainNode
  delayWet: GainNode
  delayTime: DelayNode
  audioStream: MediaStream
}

function buildEffectBus(ac: AudioContext): EffectBus {
  const input = ac.createGain()
  const master = ac.createGain()
  master.connect(ac.destination)
  const streamDest = ac.createMediaStreamDestination()
  master.connect(streamDest)

  // Dry
  const dry = ac.createGain()
  dry.gain.value = 1.0
  input.connect(dry)
  dry.connect(master)

  // Reverb
  const conv = createImpulseReverb(ac, 2.8, 1.8)
  const reverbWet = ac.createGain()
  reverbWet.gain.value = 0
  input.connect(conv)
  conv.connect(reverbWet)
  reverbWet.connect(master)

  // Delay
  const delayTime = ac.createDelay(1.0)
  delayTime.delayTime.value = 0.36
  const feedback = ac.createGain()
  feedback.gain.value = 0.38
  const delayWet = ac.createGain()
  delayWet.gain.value = 0
  input.connect(delayTime)
  delayTime.connect(feedback)
  feedback.connect(delayTime)
  delayTime.connect(delayWet)
  delayWet.connect(master)

  return { input, reverbWet, delayWet, delayTime, audioStream: streamDest.stream }
}

const SOUND_FNS: Record<ColorName, (ac: AudioContext, dest: AudioNode) => void> = {
  red: playKick,
  blue: playSnare,
  yellow: playChimeBell,
  green: playDeepTom,
}

export function useAudio() {
  const acRef = useRef<AudioContext | null>(null)
  const busRef = useRef<EffectBus | null>(null)
  const lastKickRef = useRef<number>(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const getAC = useCallback((): AudioContext => {
    if (!acRef.current) {
      acRef.current = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (acRef.current.state === 'suspended') acRef.current.resume()
    return acRef.current
  }, [])

  const getBus = useCallback((): EffectBus => {
    const ac = getAC()
    if (!busRef.current) {
      busRef.current = buildEffectBus(ac)
      setAudioStream(busRef.current.audioStream)
    }
    return busRef.current
  }, [getAC])

  // Must be called from a user gesture (button click) to unlock audio on iOS
  const initAudio = useCallback(async () => {
    const ac = getAC()
    if (ac.state === 'suspended') await ac.resume()
    getBus()
  }, [getAC, getBus])

  const trigger = useCallback((color: ColorName): number | null => {
    const ac = getAC()
    const bus = getBus()
    SOUND_FNS[color](ac, bus.input)

    if (color === 'red') {
      const now = ac.currentTime
      const gap = lastKickRef.current > 0 ? now - lastKickRef.current : 0
      lastKickRef.current = now
      if (gap > 0.18 && gap < 4.0) return Math.round(60 / gap)
    }

    return null
  }, [getAC, getBus])

  const setReverb = useCallback((v: number) => {
    if (busRef.current) busRef.current.reverbWet.gain.value = v
  }, [])

  const setDelay = useCallback((v: number) => {
    if (busRef.current) busRef.current.delayWet.gain.value = v
  }, [])

  const setDelayTime = useCallback((bpmValue: number) => {
    if (busRef.current) {
      busRef.current.delayTime.delayTime.value = 60 / bpmValue / 2
    }
  }, [])

  return { trigger, setReverb, setDelay, setDelayTime, initAudio, audioStream }
}
