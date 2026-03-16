import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import PixelCharacter from '../components/PixelCharacter'

const SHOP_ITEMS = [
  { id: 'hair_blue', name: 'Blue Hair', description: 'Electric blue hair dye', price: 50, type: 'hair', value: 'blue' },
  { id: 'hair_purple', name: 'Purple Hair', description: 'Mystical purple locks', price: 50, type: 'hair', value: 'purple' },
  { id: 'hair_pink', name: 'Pink Hair', description: 'Vibrant pink hair', price: 50, type: 'hair', value: 'pink' },
  { id: 'hair_green', name: 'Green Hair', description: 'Forest green hair', price: 75, type: 'hair', value: 'green' },
  { id: 'outfit_orange', name: 'Fire Outfit', description: 'Blazing orange gear', price: 100, type: 'clothing', value: 'orange' },
  { id: 'outfit_teal', name: 'Ocean Outfit', description: 'Cool teal training gear', price: 100, type: 'clothing', value: 'teal' },
  { id: 'outfit_yellow', name: 'Gold Outfit', description: 'Legendary gold gear', price: 200, type: 'clothing', value: 'yellow' },
  { id: 'outfit_pink', name: 'Rose Outfit', description: 'Rose pink warrior gear', price: 100, type: 'clothing', value: 'pink' },
]

export default function Shop() {
  const { profile, refreshProfile } = useAuth()
  const [buying, setBuying] = useState(null)
  const [hoverChar, setHoverChar] = useState(null)
  const [message, setMessage] = useState('')

  const inventory = profile?.inventory || []
  const equipped = profile?.equipped || {}

  const charOptions = profile?.character || { gender: 'male', charClass: 'warrior' }
  const previewOptions = charOptions

  async function handleBuy(item) {
    if ((profile?.points || 0) < item.price) return setMessage('Not enough points!')
    if (inventory.includes(item.id)) return setMessage('Already owned!')
    setBuying(item.id)
    try {
      await api.updateProfile({
        points: (profile.points || 0) - item.price,
        inventory: [...inventory, item.id],
      })
      await refreshProfile()
      setMessage(`Purchased ${item.name}!`)
    } catch { setMessage('Purchase failed.') }
    finally {
      setBuying(null)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  async function handleEquip(item) {
    const newEquipped = { ...equipped }
    if (item.type === 'hair') newEquipped.hairStyle = item.value
    if (item.type === 'clothing') newEquipped.clothingColor = item.value
    await api.updateProfile({ equipped: newEquipped })
    await refreshProfile()
    setMessage(`${item.name} equipped!`)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Item Shop</h1>
        <span className="pixel-font text-yellow-400">{profile?.points || 0} Points</span>
      </div>

      {message && (
        <div className="pixel-card p-3 mb-4 text-center text-green-400 pixel-font" style={{ fontSize: '12px' }}>{message}</div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center gap-3 md:w-48">
          <div className="pixel-card p-6 glow-purple">
            <PixelCharacter options={previewOptions} scale={1} />
          </div>
          <span className="pixel-font text-gray-500" style={{ fontSize: '12px' }}>Your Character</span>
          <div className="text-xs text-gray-600 text-center">Hover items to preview</div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SHOP_ITEMS.map(item => {
              const owned = inventory.includes(item.id)
              const isEquipped =
                (item.type === 'hair' && equipped.hairStyle === item.value) ||
                (item.type === 'clothing' && equipped.clothingColor === item.value)
              const previewChar = {
                ...(profile?.character || {}), ...equipped,
                ...(item.type === 'hair' ? { hairStyle: item.value } : { clothingColor: item.value }),
              }
              return (
                <div key={item.id}
                  className={`pixel-card p-4 cursor-pointer transition-all ${isEquipped ? 'border-sky-500 glow-purple' : 'hover:border-gray-600'}`}
                  onMouseEnter={() => setHoverChar(previewChar)}
                  onMouseLeave={() => setHoverChar(null)}>

                  <div className="text-white font-medium text-sm mb-1">{item.name}</div>
                  <div className="text-gray-500 text-xs mb-3">{item.description}</div>
                  {isEquipped ? (
                    <span className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>✓ EQUIPPED</span>
                  ) : owned ? (
                    <button onClick={() => handleEquip(item)}
                      className="pixel-btn bg-sky-800 border-sky-600 text-white px-3 py-1 w-full" style={{ fontSize: '12px' }}>
                      Equip
                    </button>
                  ) : (
                    <button onClick={() => handleBuy(item)}
                      disabled={buying === item.id || (profile?.points || 0) < item.price}
                      className={`pixel-btn px-3 py-1 w-full ${(profile?.points || 0) < item.price ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-yellow-700 border-yellow-600 text-white'}`}
                      style={{ fontSize: '12px' }}>
                      {item.price} pts
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
