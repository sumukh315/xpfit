import { Link } from 'react-router-dom'

const schemes = [
  {
    id: 'current',
    name: 'Current (Purple/Pink)',
    bg: 'linear-gradient(135deg, #0a0a14 0%, #1a0a2e 50%, #0a0a14 100%)',
    card: '#12121e',
    border: '#4c1d95',
    accent: '#a855f7',
    accent2: '#ec4899',
    text: '#c084fc',
    sub: '#6b7280',
  },
  {
    id: 'cyber-green',
    name: 'Cyber Green',
    bg: 'linear-gradient(135deg, #000000 0%, #001a00 50%, #000000 100%)',
    card: '#0a120a',
    border: '#14532d',
    accent: '#22c55e',
    accent2: '#86efac',
    text: '#4ade80',
    sub: '#6b7280',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    bg: 'linear-gradient(135deg, #000814 0%, #001d3d 50%, #000814 100%)',
    card: '#0a1628',
    border: '#1e3a5f',
    accent: '#38bdf8',
    accent2: '#67e8f9',
    text: '#7dd3fc',
    sub: '#6b7280',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    bg: 'linear-gradient(135deg, #0a0500 0%, #1f0a00 50%, #0a0500 100%)',
    card: '#160800',
    border: '#7c2d12',
    accent: '#f97316',
    accent2: '#fbbf24',
    text: '#fb923c',
    sub: '#6b7280',
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    bg: 'linear-gradient(135deg, #05050f 0%, #0f0f1f 50%, #05050f 100%)',
    card: '#0d0d1a',
    border: '#78350f',
    accent: '#f59e0b',
    accent2: '#fde68a',
    text: '#fbbf24',
    sub: '#6b7280',
  },
  {
    id: 'blood-red',
    name: 'Blood Red',
    bg: 'linear-gradient(135deg, #0a0000 0%, #1f0000 50%, #0a0000 100%)',
    card: '#130000',
    border: '#7f1d1d',
    accent: '#ef4444',
    accent2: '#f87171',
    text: '#fca5a5',
    sub: '#6b7280',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: 'linear-gradient(135deg, #010a01 0%, #071a07 50%, #010a01 100%)',
    card: '#071207',
    border: '#14532d',
    accent: '#86efac',
    accent2: '#34d399',
    text: '#6ee7b7',
    sub: '#6b7280',
  },
  {
    id: 'forest-ocean',
    name: 'Forest + Ocean (Combo)',
    bg: 'linear-gradient(135deg, #000d0d 0%, #001a14 50%, #000d0d 100%)',
    card: '#071412',
    border: '#0f4f3a',
    accent: '#34d399',
    accent2: '#38bdf8',
    text: '#6ee7b7',
    sub: '#6b7280',
  },
]

export default function ColorPreview() {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#050508' }}>
      <h1 className="text-center text-white mb-2" style={{ fontFamily: 'monospace', fontSize: '20px' }}>Color Scheme Preview</h1>
      <p className="text-center text-gray-500 mb-8" style={{ fontSize: '12px' }}>Tell me which one you want and I'll apply it to the whole site</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {schemes.map(s => (
          <div key={s.id} style={{ background: s.bg, border: `2px solid ${s.border}`, padding: '20px', borderRadius: '2px' }}>
            {/* Mini navbar */}
            <div style={{ background: s.card, border: `1px solid ${s.border}`, padding: '8px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: s.accent, fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>XP<span style={{ color: s.accent2 }}>FIT</span></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Home','Workout','Progress'].map(l => (
                  <span key={l} style={{ color: s.sub, fontFamily: 'monospace', fontSize: '12px' }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Mini card */}
            <div style={{ background: s.card, border: `1px solid ${s.border}`, padding: '12px', marginBottom: '10px' }}>
              <div style={{ color: s.text, fontFamily: 'monospace', fontSize: '13px', marginBottom: '4px' }}>Level 12 — Warrior</div>
              <div style={{ background: s.border, height: '6px', borderRadius: '1px', marginBottom: '8px' }}>
                <div style={{ background: s.accent, height: '100%', width: '65%' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: s.accent2, fontFamily: 'monospace', fontSize: '12px' }}>+50 XP</span>
                <span style={{ color: s.sub, fontFamily: 'monospace', fontSize: '12px' }}>3 exercises</span>
              </div>
            </div>

            {/* Mini button */}
            <div style={{ background: s.accent, border: `2px solid ${s.accent2}`, padding: '8px', textAlign: 'center' }}>
              <span style={{ color: '#000', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>+ New Workout</span>
            </div>

            <p style={{ color: s.text, fontFamily: 'monospace', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>{s.name}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-gray-600 mt-8" style={{ fontSize: '13px' }}>
        <Link to="/" className="text-gray-500 hover:text-white">← Back</Link>
      </p>
    </div>
  )
}
