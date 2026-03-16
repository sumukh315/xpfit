// Style preview — visit /style-preview to see box style options
import { useState } from 'react'
import PixelCharacter from '../components/PixelCharacter'
import { CLASSES, CLASS_INFO } from '../lib/pixelCharacter'

const STYLES = ['Glassy', 'Pixel Frame', 'Minimal']

export default function StylePreview() {
  const [selected, setSelected] = useState(null)
  const gender = 'male'

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#000814' }}>
      <h1 className="pixel-font text-sky-400 mb-2 text-center" style={{ fontSize: '14px' }}>
        Box Style Options
      </h1>
      <p className="text-gray-500 mb-12 text-center text-sm">Three options — pick your favourite</p>

      {/* ── Option 1: Glassy ── */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="pixel-font text-yellow-400" style={{ fontSize: '10px' }}>Option 1 — Glassy</span>
          <span className="text-gray-600 text-xs">Semi-transparent with soft glow</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CLASSES.map(cls => {
            const sel = selected === `glassy-${cls}`
            return (
              <button key={cls}
                onClick={() => setSelected(sel ? null : `glassy-${cls}`)}
                style={{
                  background: sel
                    ? 'linear-gradient(135deg, rgba(14,116,144,0.25), rgba(2,62,138,0.3))'
                    : 'linear-gradient(135deg, rgba(10,22,40,0.6), rgba(4,12,28,0.8))',
                  border: sel ? '1px solid rgba(103,232,249,0.7)' : '1px solid rgba(56,189,248,0.15)',
                  borderTopColor: sel ? 'rgba(103,232,249,0.9)' : 'rgba(103,232,249,0.25)',
                  boxShadow: sel
                    ? '0 0 16px rgba(56,189,248,0.35), inset 0 1px 0 rgba(103,232,249,0.15)'
                    : '0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(103,232,249,0.04)',
                  backdropFilter: 'blur(4px)',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}>
                <PixelCharacter options={{ gender, charClass: cls }} scale={0.4} />
                <div className="pixel-font" style={{ fontSize: '7px', color: sel ? '#67e8f9' : '#6b7280' }}>
                  {CLASS_INFO[cls].label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Option 2: Pixel Frame ── */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="pixel-font text-yellow-400" style={{ fontSize: '10px' }}>Option 2 — Pixel Frame</span>
          <span className="text-gray-600 text-xs">Hard edges, inset shadow — classic RPG slot</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CLASSES.map(cls => {
            const sel = selected === `pixel-${cls}`
            return (
              <button key={cls}
                onClick={() => setSelected(sel ? null : `pixel-${cls}`)}
                style={{
                  background: sel ? '#0d2137' : '#060d18',
                  border: sel ? '2px solid #38bdf8' : '2px solid #1e3a52',
                  borderBottom: sel ? '2px solid #0ea5e9' : '2px solid #0f2030',
                  borderRight: sel ? '2px solid #0ea5e9' : '2px solid #0f2030',
                  boxShadow: sel
                    ? 'inset 0 0 0 1px rgba(56,189,248,0.2), 0 0 12px rgba(56,189,248,0.2)'
                    : 'inset 0 0 0 1px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(0,0,0,0.6)',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  imageRendering: 'pixelated',
                }}>
                <PixelCharacter options={{ gender, charClass: cls }} scale={0.4} />
                <div className="pixel-font" style={{ fontSize: '7px', color: sel ? '#38bdf8' : '#4b6680' }}>
                  {CLASS_INFO[cls].label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Option 3: Minimal ── */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="pixel-font text-yellow-400" style={{ fontSize: '10px' }}>Option 3 — Minimal</span>
          <span className="text-gray-600 text-xs">Clean lines, bottom-only highlight on select</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CLASSES.map(cls => {
            const sel = selected === `minimal-${cls}`
            return (
              <button key={cls}
                onClick={() => setSelected(sel ? null : `minimal-${cls}`)}
                style={{
                  background: sel ? 'rgba(14,116,144,0.12)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: sel ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.06)',
                  borderBottom: sel ? '2px solid #38bdf8' : '2px solid rgba(255,255,255,0.08)',
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}>
                <PixelCharacter options={{ gender, charClass: cls }} scale={0.4} />
                <div className="pixel-font" style={{ fontSize: '7px', color: sel ? '#38bdf8' : '#4b5563' }}>
                  {CLASS_INFO[cls].label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs">Click any box to see selected state</p>
    </div>
  )
}
