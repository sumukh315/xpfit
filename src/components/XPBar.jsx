import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'

export default function XPBar({ totalXP = 0 }) {
  const { level, currentXP, xpNeeded } = getLevelFromXP(totalXP)
  const percent = Math.min((currentXP / xpNeeded) * 100, 100)
  const title = getLevelTitle(level)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="pixel-font text-purple-400" style={{ fontSize: '9px' }}>
          LVL {level} — {title}
        </span>
        <span className="pixel-font text-gray-400" style={{ fontSize: '8px' }}>
          {currentXP}/{xpNeeded} XP
        </span>
      </div>
      <div className="xp-bar-container">
        <div className="xp-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
