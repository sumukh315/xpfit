import { getSpriteStyle } from '../lib/pixelCharacter'

export default function PixelCharacter({ options = {}, scale = 1, className = '' }) {
  const charClass = options.charClass || options.class || 'warrior'
  const gender    = options.gender || 'male'

  const displayWidth = Math.round(160 * scale)
  const style = getSpriteStyle(charClass, gender, displayWidth)

  // Fixed container height so all character boxes are identical regardless of
  // where the art sits in the sprite cell. Characters align to the bottom.
  const containerH = Math.round(120 * scale)

  return (
    <div
      className={className}
      style={{
        width: displayWidth,
        height: containerH,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{ ...style, flexShrink: 0 }} />
    </div>
  )
}
