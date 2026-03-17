import { getPet } from '../lib/pets'

// Spritesheet: 1024×1536px, 2 cols × 3 rows, each cell 512×512px
export default function PetSprite({ petId, size = 80 }) {
  const pet = getPet(petId)
  if (!pet) return null

  const bgW = 2 * size
  const bgH = 3 * size
  const offsetX = -(pet.col * size)
  const offsetY = -(pet.row * size) + (pet.yAdjust || 0)

  return (
    <div style={{
      width: size,
      height: size,
      backgroundImage: 'url(/pets.png)',
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `${offsetX}px ${offsetY}px`,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
    }} />
  )
}
