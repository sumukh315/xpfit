import { useEffect } from 'react'

const FONTS = [
  {
    id: 'outfit',
    name: 'Outfit',
    label: 'Current',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap',
    desc: 'Geometric, uppercase-friendly',
  },
  {
    id: 'inter',
    name: 'Inter',
    label: 'Option A',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap',
    desc: 'Ultra-clean, used by Vercel, Linear, Figma',
  },
  {
    id: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    label: 'Option B',
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap',
    desc: 'Premium, slightly rounded, modern apps',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    label: 'Option C',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap',
    desc: 'Techy with personality, great for fitness',
  },
  {
    id: 'sora',
    name: 'Sora',
    label: 'Option D',
    url: 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap',
    desc: 'Geometric, ultra-sleek, minimal',
  },
]

function FontCard({ font }) {
  useEffect(() => {
    const existing = document.querySelector(`link[data-font="${font.id}"]`)
    if (!existing) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = font.url
      link.setAttribute('data-font', font.id)
      document.head.appendChild(link)
    }
  }, [font])

  const f = `'${font.name}', sans-serif`

  return (
    <div className="pixel-card p-6 flex flex-col gap-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: f, fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
          {font.label}
        </span>
        <span style={{ fontFamily: f, fontSize: '11px', color: '#475569' }}>{font.desc}</span>
      </div>

      {/* Logo */}
      <div style={{ fontFamily: f, fontWeight: 800, fontSize: '28px', letterSpacing: '0.01em' }}>
        <span style={{ color: '#6ab04c' }}>XP</span><span style={{ color: '#e63946' }}>FIT</span>
      </div>

      {/* Section label */}
      <div style={{ fontFamily: f, fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#38bdf8' }}>
        Share Your Workout
      </div>

      {/* Body text */}
      <div style={{ fontFamily: f, fontWeight: 400, fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
        You crushed Push Day — 6 exercises, 24 sets. +420 XP earned.
      </div>

      {/* Stat nums */}
      <div className="flex gap-4">
        <div>
          <div style={{ fontFamily: f, fontWeight: 700, fontSize: '22px', color: '#facc15' }}>42</div>
          <div style={{ fontFamily: f, fontSize: '11px', color: '#4b5563', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Level</div>
        </div>
        <div>
          <div style={{ fontFamily: f, fontWeight: 700, fontSize: '22px', color: '#38bdf8' }}>8,240</div>
          <div style={{ fontFamily: f, fontSize: '11px', color: '#4b5563', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Total XP</div>
        </div>
      </div>

      {/* Button */}
      <button className="pixel-btn bg-sky-700 border-sky-500 text-white py-2 px-4 w-full"
        style={{ fontFamily: f, fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' }}>
        Finish Workout
      </button>

      {/* Font name */}
      <div style={{ fontFamily: f, fontWeight: 600, fontSize: '15px', color: '#e2e8f0' }}>
        {font.name}
      </div>
    </div>
  )
}

export default function FontPreview() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '8px' }}>
        Font Preview
      </h1>
      <p style={{ color: '#475569', fontSize: '13px', marginBottom: '32px' }}>
        Same UI elements, different fonts. Pick one and tell me.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FONTS.map(f => <FontCard key={f.id} font={f} />)}
      </div>
    </div>
  )
}
