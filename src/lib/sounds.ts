type AC = AudioContext

function noise(ac: AC, durationSec: number): AudioBufferSourceNode {
  const len = Math.floor(ac.sampleRate * durationSec)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  return src
}

export function createImpulseReverb(ac: AC, durationSec: number, decay: number): ConvolverNode {
  const len = Math.floor(ac.sampleRate * durationSec)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  const conv = ac.createConvolver()
  conv.buffer = buf
  return conv
}

export function playKick(ac: AC, dest: AudioNode) {
  const t = ac.currentTime

  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(160, t)
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.4)
  g.gain.setValueAtTime(2.0, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.45)

  const click = noise(ac, 0.012)
  const cg = ac.createGain()
  cg.gain.setValueAtTime(0.55, t)
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.012)
  click.connect(cg)
  cg.connect(dest)
  click.start(t)
  click.stop(t + 0.012)
}

export function playSnare(ac: AC, dest: AudioNode) {
  const t = ac.currentTime

  const ns = noise(ac, 0.2)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1100
  const ng = ac.createGain()
  ng.gain.setValueAtTime(1.0, t)
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  ns.connect(hp)
  hp.connect(ng)
  ng.connect(dest)
  ns.start(t)
  ns.stop(t + 0.18)

  const osc = ac.createOscillator()
  const og = ac.createGain()
  osc.frequency.setValueAtTime(230, t)
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.08)
  og.gain.setValueAtTime(0.9, t)
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(og)
  og.connect(dest)
  osc.start(t)
  osc.stop(t + 0.1)
}

export function playChimeBell(ac: AC, dest: AudioNode) {
  const t = ac.currentTime

  const conv = createImpulseReverb(ac, 2.2, 2.2)
  const rg = ac.createGain()
  rg.gain.value = 0.32
  conv.connect(rg)
  rg.connect(dest)

  const partials = [
    { f: 1047, a: 0.55, d: 2.2 },
    { f: 1568, a: 0.28, d: 1.8 },
    { f: 2093, a: 0.16, d: 1.4 },
    { f: 2637, a: 0.09, d: 1.0 },
  ]

  for (const { f, a, d } of partials) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    g.gain.setValueAtTime(a, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + d)
    osc.connect(g)
    g.connect(dest)
    g.connect(conv)
    osc.start(t)
    osc.stop(t + d)
  }
}

export function playDeepTom(ac: AC, dest: AudioNode) {
  const t = ac.currentTime

  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(108, t)
  osc.frequency.exponentialRampToValueAtTime(52, t + 0.4)
  g.gain.setValueAtTime(1.8, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.48)
  osc.connect(g)
  g.connect(dest)
  osc.start(t)
  osc.stop(t + 0.48)

  const smack = noise(ac, 0.035)
  const sg = ac.createGain()
  sg.gain.setValueAtTime(0.42, t)
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.035)
  smack.connect(sg)
  sg.connect(dest)
  smack.start(t)
  smack.stop(t + 0.035)
}
