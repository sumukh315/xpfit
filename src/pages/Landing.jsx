import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a0a2e 50%, #0a0a14 100%)' }}>
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="fantasy-title text-6xl mb-4" style={{ color: '#a855f7', textShadow: '0 0 30px rgba(168,85,247,0.8), 4px 4px 0px #000' }}>
          XP<span style={{ color: '#ec4899' }}>FIT</span>
        </h1>
        <p className="fantasy-font text-purple-300 mb-2" style={{ fontSize: '14px' }}>
          Level Up Your Fitness
        </p>
        <p className="text-gray-400 max-w-md mx-auto mt-4">
          Track workouts, earn XP, level up your pixel character, and compete with friends.
          The gym just became your quest.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-3xl w-full">
        {[
          { emoji: '⚔️', label: 'Earn XP', desc: 'Every set earns experience' },
          { emoji: '🎮', label: 'Level Up', desc: 'Grow your pixel character' },
          { emoji: '🛒', label: 'Shop', desc: 'Spend points on gear' },
          { emoji: '👥', label: 'Social', desc: 'Challenge your friends' },
        ].map(f => (
          <div key={f.label} className="pixel-card p-4 text-center">
            <div className="text-3xl mb-2">{f.emoji}</div>
            <div className="pixel-font text-purple-300 mb-1" style={{ fontSize: '8px' }}>{f.label}</div>
            <div className="text-gray-400" style={{ fontSize: '11px' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-4">
        <Link
          to="/signup"
          className="pixel-btn bg-purple-700 border-purple-500 text-white px-8 py-4 hover:bg-purple-600 no-underline"
          style={{ fontSize: '11px' }}
        >
          Start Quest
        </Link>
        <Link
          to="/login"
          className="pixel-btn bg-transparent border-gray-600 text-gray-300 px-8 py-4 hover:border-purple-500 hover:text-white no-underline"
          style={{ fontSize: '11px' }}
        >
          Login
        </Link>
      </div>

      <p className="text-gray-600 mt-8" style={{ fontSize: '11px' }}>
        Free to play. No pay-to-win. Just gains.
      </p>
    </div>
  )
}
