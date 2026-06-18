interface Props {
  running: boolean
  sensitivity: number
  cooldownMs: number
  bpm: number | null
  reverb: number
  delay: number
  delayBpm: number
  recording: boolean
  blobUrl: string | null
  onStart: () => void
  onStop: () => void
  onSensitivityChange: (v: number) => void
  onCooldownChange: (v: number) => void
  onReverbChange: (v: number) => void
  onDelayChange: (v: number) => void
  onDelayBpmChange: (v: number) => void
  onRecordStart: () => void
  onRecordStop: () => void
}

export function Controls({
  running, sensitivity, cooldownMs, bpm,
  reverb, delay, delayBpm,
  recording, blobUrl,
  onStart, onStop,
  onSensitivityChange, onCooldownChange,
  onReverbChange, onDelayChange, onDelayBpmChange,
  onRecordStart, onRecordStop,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Row 1: start/stop + detection */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={running ? onStop : onStart}
          className="px-4 py-1.5 text-[11px] font-bold tracking-wider rounded-sm shrink-0 cursor-pointer"
          style={{ background: '#ffffff', color: '#000', fontFamily: 'monospace' }}
        >
          {running ? '■ 중지' : '▶ 시작'}
        </button>

        <label className="flex items-center gap-1.5 text-[9px] tracking-wide flex-1 min-w-0" style={{ color: '#444' }}>
          <span className="shrink-0">감도</span>
          <input
            type="range"
            min={3} max={60} value={sensitivity}
            onChange={e => onSensitivityChange(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
        </label>

        <label className="flex items-center gap-1.5 text-[9px] tracking-wide flex-1 min-w-0" style={{ color: '#444' }}>
          <span className="shrink-0">쿨다운</span>
          <input
            type="range"
            min={80} max={1200} value={cooldownMs}
            onChange={e => onCooldownChange(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
        </label>

        <span
          className="text-[10px] tracking-wider shrink-0 tabular-nums"
          style={{ color: bpm ? '#555' : '#2a2a2a', minWidth: 52, textAlign: 'right' }}
        >
          {bpm ? `${bpm} BPM` : '-- BPM'}
        </span>
      </div>

      {/* Row 2: recording */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[9px] tracking-widest shrink-0" style={{ color: '#333' }}>REC</span>

        <button
          onClick={recording ? onRecordStop : onRecordStart}
          disabled={!running}
          className="px-3 py-1 text-[10px] font-bold tracking-wider rounded-sm shrink-0 cursor-pointer disabled:opacity-30"
          style={{
            background: recording ? '#ff3333' : '#222',
            color: recording ? '#fff' : '#888',
            border: '1px solid #333',
            fontFamily: 'monospace',
          }}
        >
          {recording ? '⏹ STOP' : '⏺ REC'}
        </button>

        {recording && (
          <span className="text-[9px] tracking-wider animate-pulse" style={{ color: '#ff3333' }}>
            REC...
          </span>
        )}

        {blobUrl && !recording && (
          <a
            href={blobUrl}
            download="lp-drum-machine.webm"
            className="text-[10px] tracking-wider px-3 py-1 rounded-sm"
            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333', fontFamily: 'monospace' }}
          >
            ↓ SAVE
          </a>
        )}
      </div>

      {/* Row 3: effects */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[9px] tracking-widest shrink-0" style={{ color: '#333' }}>FX</span>

        <label className="flex items-center gap-1.5 text-[9px] tracking-wide flex-1 min-w-0" style={{ color: '#444' }}>
          <span className="shrink-0">REVERB</span>
          <input
            type="range"
            min={0} max={100} value={reverb}
            onChange={e => onReverbChange(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
          <span className="shrink-0 tabular-nums" style={{ minWidth: 24, textAlign: 'right' }}>{reverb}</span>
        </label>

        <label className="flex items-center gap-1.5 text-[9px] tracking-wide flex-1 min-w-0" style={{ color: '#444' }}>
          <span className="shrink-0">DELAY</span>
          <input
            type="range"
            min={0} max={100} value={delay}
            onChange={e => onDelayChange(Number(e.target.value))}
            className="flex-1 min-w-0"
          />
          <span className="shrink-0 tabular-nums" style={{ minWidth: 24, textAlign: 'right' }}>{delay}</span>
        </label>

        <label className="flex items-center gap-1.5 text-[9px] tracking-wide shrink-0" style={{ color: '#444' }}>
          <span className="shrink-0">D.BPM</span>
          <input
            type="range"
            min={60} max={200} value={delayBpm}
            onChange={e => onDelayBpmChange(Number(e.target.value))}
            style={{ width: 56 }}
          />
          <span className="shrink-0 tabular-nums" style={{ minWidth: 24, textAlign: 'right' }}>{delayBpm}</span>
        </label>
      </div>
    </div>
  )
}
