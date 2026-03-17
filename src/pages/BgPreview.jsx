import { useState } from 'react'

const OPTIONS = [
  { id: 'constellation', label: 'Constellation Grid', desc: 'Star dots connected by drifting lines' },
  { id: 'aurora', label: 'Aurora Borealis', desc: 'Slow horizontal wave bands of color' },
  { id: 'hex', label: 'Hex Grid', desc: 'Honeycomb pattern with orbs casting light' },
  { id: 'particles', label: 'Particle Field', desc: 'Floating embers drifting upward' },
  { id: 'topo', label: 'Topographic Lines', desc: 'Animated contour terrain lines' },
]

// ─── Constellation ────────────────────────────────────────────────────────────
function ConstellationBg() {
  const stars = Array.from({ length: 28 }, (_, i) => ({
    x: (i * 37 + 15) % 100,
    y: (i * 53 + 10) % 100,
    r: i % 3 === 0 ? 1.5 : 1,
    dur: 3 + (i % 4),
    delay: i * 0.3,
  }))
  const lines = [[0,4],[1,6],[2,7],[4,8],[6,9],[3,10],[5,11],[7,12],[8,13],[9,14]]

  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <style>{`
          @keyframes star-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
          @keyframes line-fade  { 0%,100%{opacity:.06} 50%{opacity:.22} }
        `}</style>
      </defs>
      {lines.map(([a,b],i) => (
        <line key={i}
          x1={`${stars[a].x}%`} y1={`${stars[a].y}%`}
          x2={`${stars[b].x}%`} y2={`${stars[b].y}%`}
          stroke="rgba(103,232,249,1)" strokeWidth="0.5"
          style={{ animation: `line-fade ${3+i*0.4}s ${i*0.5}s ease-in-out infinite` }}
        />
      ))}
      {stars.map((s,i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={i%5===0 ? '#a78bfa' : i%3===0 ? '#67e8f9' : '#fff'}
          style={{ animation: `star-pulse ${s.dur}s ${s.delay}s ease-in-out infinite` }}
        />
      ))}
    </svg>
  )
}

// ─── Aurora ───────────────────────────────────────────────────────────────────
function AuroraBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes aurora-1 { 0%,100%{transform:translateY(0) scaleX(1)} 50%{transform:translateY(-12px) scaleX(1.06)} }
        @keyframes aurora-2 { 0%,100%{transform:translateY(0) scaleX(1)} 50%{transform:translateY(10px) scaleX(0.94)} }
        @keyframes aurora-3 { 0%,100%{transform:translateY(0)} 60%{transform:translateY(-8px)} }
      `}</style>
      {[
        { top:'8%',  h:120, colors:'rgba(34,211,238,0.35),rgba(99,102,241,0.2),transparent', dur:'8s' },
        { top:'22%', h:90,  colors:'rgba(106,176,76,0.28),rgba(34,211,238,0.15),transparent', dur:'11s', delay:'2s', anim:'aurora-2' },
        { top:'38%', h:70,  colors:'rgba(192,132,252,0.25),rgba(99,102,241,0.1),transparent', dur:'14s', delay:'1s', anim:'aurora-3' },
        { top:'52%', h:100, colors:'rgba(56,189,248,0.2),rgba(34,211,238,0.08),transparent', dur:'9s', delay:'3s' },
      ].map((b,i) => (
        <div key={i} style={{
          position:'absolute', left:'-10%', right:'-10%',
          top: b.top, height: b.h,
          background: `linear-gradient(180deg, transparent, ${b.colors})`,
          filter: 'blur(18px)',
          animation: `${b.anim||'aurora-1'} ${b.dur} ${b.delay||'0s'} ease-in-out infinite`,
        }}/>
      ))}
    </div>
  )
}

// ─── Hex Grid ─────────────────────────────────────────────────────────────────
function HexBg() {
  const HEX = 'M18,3 L33,12 L33,30 L18,39 L3,30 L3,12 Z'
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes hex-glow { 0%,100%{opacity:.04} 50%{opacity:.14} }
        @keyframes hex-orb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-10px)} }
      `}</style>
      {/* Orb behind */}
      <div style={{
        position:'absolute', width:200, height:200, top:'10%', left:'20%',
        background:'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)',
        filter:'blur(30px)',
        animation:'hex-orb 6s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', width:160, height:160, bottom:'15%', right:'15%',
        background:'radial-gradient(circle, rgba(192,132,252,0.35) 0%, transparent 70%)',
        filter:'blur(25px)',
        animation:'hex-orb 8s 2s ease-in-out infinite',
      }}/>
      {/* SVG hex grid */}
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
        <defs>
          <pattern id="hexPrev" x="0" y="0" width="36" height="42" patternUnits="userSpaceOnUse">
            <path d={HEX} fill="none" stroke="rgba(103,232,249,1)" strokeWidth="0.6"
              style={{ animation:'hex-glow 4s ease-in-out infinite' }}/>
          </pattern>
          <pattern id="hexPrev2" x="18" y="21" width="36" height="42" patternUnits="userSpaceOnUse">
            <path d={HEX} fill="none" stroke="rgba(103,232,249,1)" strokeWidth="0.6"
              style={{ animation:'hex-glow 4s 2s ease-in-out infinite' }}/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexPrev)" opacity="1"/>
        <rect width="100%" height="100%" fill="url(#hexPrev2)" opacity="1"/>
      </svg>
    </div>
  )
}

// ─── Particles ────────────────────────────────────────────────────────────────
function ParticlesBg() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    x: (i * 41 + 5) % 95,
    size: 1.5 + (i % 3) * 0.8,
    dur: 4 + (i % 5) * 1.2,
    delay: (i * 0.4) % 5,
    color: i % 4 === 0 ? '#f97316' : i % 3 === 0 ? '#67e8f9' : i % 2 === 0 ? '#a78bfa' : '#6ab04c',
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes rise { 0%{transform:translateY(100%) scale(1);opacity:0} 20%{opacity:.9} 80%{opacity:.6} 100%{transform:translateY(-20px) scale(0.4);opacity:0} }
      `}</style>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`,
          bottom: 0,
          width: p.size,
          height: p.size,
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animation: `rise ${p.dur}s ${p.delay}s ease-in infinite`,
        }}/>
      ))}
    </div>
  )
}

// ─── Topographic ─────────────────────────────────────────────────────────────
function TopoBg() {
  const lines = [
    'M-50,80 Q120,30 280,90 T580,60',
    'M-50,130 Q100,70 260,140 T580,110',
    'M-50,170 Q140,110 300,175 T580,155',
    'M-50,210 Q110,155 270,215 T580,195',
    'M-50,250 Q130,195 290,255 T580,235',
    'M-50,290 Q105,230 265,290 T580,270',
    'M-50,50  Q160,10 310,55 T580,30',
    'M-50,330 Q120,275 280,330 T580,310',
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes topo-drift { 0%{transform:translateX(0)} 100%{transform:translateX(40px)} }
        @keyframes topo-fade  { 0%,100%{opacity:.07} 50%{opacity:.18} }
      `}</style>
      <svg width="100%" height="100%" viewBox="0 0 530 360" preserveAspectRatio="xMidYMid slice"
        style={{ position:'absolute', inset:0 }}>
        {lines.map((d, i) => (
          <path key={i} d={d} fill="none"
            stroke={i % 3 === 0 ? 'rgba(103,232,249,1)' : i % 2 === 0 ? 'rgba(106,176,76,1)' : 'rgba(192,132,252,1)'}
            strokeWidth="1"
            style={{
              animation: `topo-drift ${12+i*2}s ${i*0.7}s linear infinite alternate, topo-fade ${5+i}s ${i*0.5}s ease-in-out infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

const BG_COMPONENTS = {
  constellation: ConstellationBg,
  aurora: AuroraBg,
  hex: HexBg,
  particles: ParticlesBg,
  topo: TopoBg,
}

export default function BgPreview() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-sky-400 mb-2" style={{ fontSize: '14px' }}>Background Preview</h1>
      <p className="text-gray-500 mb-6" style={{ fontSize: '13px' }}>Tap a style to see it fullscreen. These would replace or layer on top of the current orbs.</p>

      <div className="grid grid-cols-1 gap-4">
        {OPTIONS.map(opt => {
          const BgComp = BG_COMPONENTS[opt.id]
          return (
            <div key={opt.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-semibold" style={{ fontSize: '14px' }}>{opt.label}</span>
                  <span className="text-gray-500 ml-3" style={{ fontSize: '12px' }}>{opt.desc}</span>
                </div>
                <button
                  onClick={() => setSelected(selected === opt.id ? null : opt.id)}
                  className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-1.5"
                  style={{ fontSize: '12px' }}>
                  {selected === opt.id ? 'Close' : 'Fullscreen'}
                </button>
              </div>
              {/* Preview panel */}
              <div className="rounded-2xl overflow-hidden border border-gray-800" style={{ height: 180, position: 'relative', background: '#000814' }}>
                <BgComp />
                {/* Sample content overlay */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div className="pixel-card px-4 py-3 text-center" style={{ background: 'rgba(10,22,40,0.7)' }}>
                    <div className="pixel-font text-sky-400" style={{ fontSize: '11px' }}>LEVEL 12</div>
                    <div className="text-white font-bold" style={{ fontSize: '16px' }}>Push Day</div>
                    <div className="text-gray-400" style={{ fontSize: '11px' }}>+240 XP</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fullscreen overlay */}
      {selected && (() => {
        const BgComp = BG_COMPONENTS[selected]
        const opt = OPTIONS.find(o => o.id === selected)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000814' }}>
            <BgComp />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
              <div className="pixel-card p-6 text-center" style={{ maxWidth: 320 }}>
                <div className="pixel-font text-sky-400 mb-1" style={{ fontSize: '12px' }}>PREVIEW</div>
                <div className="text-white font-bold mb-1" style={{ fontSize: '20px' }}>{opt.label}</div>
                <div className="text-gray-400" style={{ fontSize: '13px' }}>{opt.desc}</div>
              </div>
              <div className="pixel-card p-4" style={{ maxWidth: 320, width: '100%' }}>
                <div className="text-white font-bold mb-3" style={{ fontSize: '15px' }}>Leg Day</div>
                <div className="flex gap-4 mb-2">
                  <div className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>+320 XP</div>
                  <div className="pixel-font text-yellow-400" style={{ fontSize: '13px' }}>+80 pts</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Squat','Leg Press','Romanian Deadlift'].map(e => (
                    <span key={e} className="glass-row px-2 py-0.5 text-gray-400" style={{ fontSize: '12px' }}>{e}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="pixel-btn bg-gray-800 border-gray-600 text-white px-8 py-3"
                style={{ position: 'relative', zIndex: 1 }}>
                ← Back to options
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
