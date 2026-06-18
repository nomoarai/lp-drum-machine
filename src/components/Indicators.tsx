import { COLOR_DEFS, COLOR_NAMES, type ColorName } from '../types'

interface Props {
  active: Record<ColorName, boolean>
  onTest: (color: ColorName) => void
}

export function Indicators({ active, onTest }: Props) {
  return (
    <div className="flex justify-center gap-3.5 mb-3">
      {COLOR_NAMES.map(name => {
        const def = COLOR_DEFS[name]
        const isActive = active[name]

        return (
          <button
            key={name}
            onClick={() => onTest(name)}
            className="flex flex-col items-center gap-1.5 transition-opacity duration-75 cursor-pointer"
            style={{ opacity: isActive ? 1 : 0.28 }}
          >
            <div
              className="w-11 h-11 rounded-full border flex items-center justify-center text-xl transition-transform duration-75"
              style={{
                borderColor: isActive ? '#ffffff' : '#333333',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                transform: isActive ? 'scale(1.18)' : 'scale(1)',
                boxShadow: isActive ? '0 0 18px rgba(255,255,255,0.5)' : 'none',
              }}
            >
              {def.emoji}
            </div>
            <span className="text-[8px] tracking-widest" style={{ color: '#555' }}>
              {def.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
