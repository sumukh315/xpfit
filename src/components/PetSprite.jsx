import { getPet } from '../lib/pets'

export default function PetSprite({ petId, size = 80 }) {
  const pet = getPet(petId)
  if (!pet) return null

  if (pet.image) {
    return (
      <div style={{
        width: size,
        height: size,
        backgroundImage: `url(${pet.image})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
      }} />
    )
  }

  const cols = pet.cols || 2
  const rows = pet.rows || 3
  const bgW = cols * size
  const bgH = rows * size
  const offsetX = -(pet.col * size)
  const offsetY = -(pet.row * size) + (pet.yAdjust || 0)
  const sheet = pet.sheet || '/pets.png'

  return (
    <div style={{
      width: size,
      height: size,
      backgroundImage: `url(${sheet})`,
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `${offsetX}px ${offsetY}px`,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
    }} />
  )
}
