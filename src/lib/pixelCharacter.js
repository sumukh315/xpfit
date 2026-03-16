// Sprite sheet: /characters/sprites.png — 1536×1024, 4 cols × 3 rows, each cell 384×341
// Layout (col, row):
//   Row 0: warrior-m(0,0), warrior-f(1,0), mage-m(2,0), mage-f(3,0)
//   Row 1: ranger-m(0,1), ranger-f(1,1), assassin-m(2,1), assassin-f(3,1)
//   Row 2: paladin-m(0,2), paladin-f(1,2), necromancer-m(2,2), necromancer-f(3,2)

export const CLASSES = ['warrior', 'mage', 'ranger', 'assassin', 'paladin', 'necromancer']

export const CLASS_INFO = {
  warrior:     { label: 'Warrior',     desc: 'Strength & defense',   col: 0, row: 0, unlockLevel: 1  },
  mage:        { label: 'Mage',        desc: 'Arcane power',         col: 2, row: 0, unlockLevel: 1  },
  ranger:      { label: 'Ranger',      desc: 'Swift & precise',      col: 0, row: 1, unlockLevel: 5  },
  assassin:    { label: 'Assassin',    desc: 'Stealth & speed',      col: 2, row: 1, unlockLevel: 10 },
  paladin:     { label: 'Paladin',     desc: 'Holy warrior',         col: 0, row: 2, unlockLevel: 15 },
  necromancer: { label: 'Necromancer', desc: 'Dark arts',            col: 2, row: 2, unlockLevel: 20 },
}

export function getUnlockedClasses(level) {
  return CLASSES.filter(cls => CLASS_INFO[cls].unlockLevel <= level)
}

// Sprite sheet dimensions
const SHEET_W = 1536
const SHEET_H = 1024
const CELL_W  = 384
const CELL_H  = 341

export function getSpriteStyle(charClass, gender, displayWidth = 160) {
  const info = CLASS_INFO[charClass] || CLASS_INFO.warrior
  const colOffset = gender === 'female' ? 1 : 0
  const col = info.col + colOffset
  const row = info.row

  const scale = displayWidth / CELL_W
  const bgW = Math.round(SHEET_W * scale)
  const bgH = Math.round(SHEET_H * scale)
  const posX = -Math.round(col * CELL_W * scale)
  const posY = -Math.round(row * CELL_H * scale)
  const displayH = Math.round(CELL_H * scale)

  // Female characters are not centered within their sprite cells — apply a
  // small leftward shift to visually center the character art.
  const xAdjust = gender === 'female' ? Math.round(-15 * scale) : 0

  return {
    width: displayWidth,
    height: displayH,
    backgroundImage: 'url(/characters/sprites.png)',
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${posX + xAdjust}px ${posY}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  }
}
