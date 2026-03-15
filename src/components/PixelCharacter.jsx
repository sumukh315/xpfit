import { getSpriteStyle } from '../lib/pixelCharacter'

export default function PixelCharacter({ options = {}, scale = 1, className = '' }) {
  const charClass = options.charClass || options.class || 'warrior'
  const gender    = options.gender || 'male'

  // base display width = 160px, scale multiplier for larger renders
  const displayWidth = Math.round(160 * scale)
  const style = getSpriteStyle(charClass, gender, displayWidth)

  return (
    <div
      className={className}
      style={{ ...style, display: 'inline-block', flexShrink: 0 }}
    />
  )
}
