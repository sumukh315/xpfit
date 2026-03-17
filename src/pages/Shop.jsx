import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import PixelCharacter from '../components/PixelCharacter'
import PetSprite from '../components/PetSprite'
import { PETS } from '../lib/pets'

const SHOP_ITEMS = [
  { id: 'hair_blue',     name: 'Blue Hair',    description: 'Electric blue hair dye',   price: 50,  type: 'hair',     value: 'blue'   },
  { id: 'hair_purple',   name: 'Purple Hair',  description: 'Mystical purple locks',     price: 50,  type: 'hair',     value: 'purple' },
  { id: 'hair_pink',     name: 'Pink Hair',    description: 'Vibrant pink hair',          price: 50,  type: 'hair',     value: 'pink'   },
  { id: 'hair_green',    name: 'Green Hair',   description: 'Forest green hair',          price: 75,  type: 'hair',     value: 'green'  },
  { id: 'outfit_orange', name: 'Fire Outfit',  description: 'Blazing orange gear',        price: 100, type: 'clothing', value: 'orange' },
  { id: 'outfit_teal',   name: 'Ocean Outfit', description: 'Cool teal training gear',    price: 100, type: 'clothing', value: 'teal'   },
  { id: 'outfit_yellow', name: 'Gold Outfit',  description: 'Legendary gold gear',        price: 200, type: 'clothing', value: 'yellow' },
  { id: 'outfit_pink',   name: 'Rose Outfit',  description: 'Rose pink warrior gear',     price: 100, type: 'clothing', value: 'pink'   },
]

export default function Shop() {
  const { profile, refreshProfile } = useAuth()
  const [tab, setTab] = useState('items')
  const [buying, setBuying] = useState(null)
  const [hoverChar, setHoverChar] = useState(null)
  const [message, setMessage] = useState('')

  const inventory = profile?.inventory  || []
  const equipped  = profile?.equipped   || {}
  const ownedPets = profile?.owned_pets || []
  const activePet = profile?.active_pet || null
  const points    = profile?.points     || 0
  const prPoints  = profile?.pr_points  || 0

  const charOptions    = profile?.character || { gender: 'male', charClass: 'warrior' }
  const previewOptions = hoverChar || charOptions

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  async function handleBuy(item) {
    if (points < item.price) return flash('Not enough points!')
    if (inventory.includes(item.id)) return flash('Already owned!')
    setBuying(item.id)
    try {
      await api.updateProfile({ points: points - item.price, inventory: [...inventory, item.id] })
      await refreshProfile()
      flash(`Purchased ${item.name}!`)
    } catch { flash('Purchase failed.') }
    finally { setBuying(null) }
  }

  async function handleEquip(item) {
    const newEquipped = { ...equipped }
    if (item.type === 'hair')     newEquipped.hairStyle     = item.value
    if (item.type === 'clothing') newEquipped.clothingColor = item.value
    await api.updateProfile({ equipped: newEquipped })
    await refreshProfile()
    flash(`${item.name} equipped!`)
  }

  async function handleBuyPet(pet) {
    const balance = pet.costType === 'pr_points' ? prPoints : points
    if (balance < pet.cost) return flash(pet.costType === 'pr_points' ? 'Not enough PR Points!' : 'Not enough points!')
    if (ownedPets.includes(pet.id)) return flash('Already owned!')
    setBuying(pet.id)
    try {
      const update = { owned_pets: [...ownedPets, pet.id] }
      if (pet.costType === 'pr_points') update.pr_points = prPoints - pet.cost
      else update.points = points - pet.cost
      await api.updateProfile(update)
      await refreshProfile()
      flash(`${pet.name} adopted!`)
    } catch { flash('Purchase failed.') }
    finally { setBuying(null) }
  }

  async function handleEquipPet(petId) {
    const newActive = activePet === petId ? null : petId
    await api.updateProfile({ active_pet: newActive })
    await refreshProfile()
    flash(newActive ? 'Pet equipped!' : 'Pet unequipped.')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Shop</h1>
        <div className="flex gap-4">
          <span className="pixel-font text-yellow-400" style={{ fontSize: '13px' }}>{points} pts</span>
          <span className="pixel-font text-purple-400" style={{ fontSize: '13px' }}>{prPoints} PR pts</span>
        </div>
      </div>

      {message && (
        <div className="pixel-card p-3 mb-4 text-center text-green-400 pixel-font" style={{ fontSize: '12px' }}>{message}</div>
      )}

      <div className="flex gap-2 mb-6">
        {[['items', 'Items'], ['pets', 'Pets']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 pixel-font transition-all ${tab === id ? 'glass-option-active text-sky-300' : 'glass-option text-gray-500'}`}
            style={{ fontSize: '12px' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3 md:w-48 flex-shrink-0">
            <div className="pixel-card p-6 glow-purple">
              <PixelCharacter options={previewOptions} scale={1} />
            </div>
            <span className="pixel-font text-gray-500" style={{ fontSize: '12px' }}>Your Character</span>
            <div className="text-gray-600 text-center" style={{ fontSize: '12px' }}>Hover items to preview</div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {SHOP_ITEMS.map(item => {
              const owned = inventory.includes(item.id)
              const isEquipped =
                (item.type === 'hair'     && equipped.hairStyle     === item.value) ||
                (item.type === 'clothing' && equipped.clothingColor === item.value)
              const previewChar = {
                ...(profile?.character || {}), ...equipped,
                ...(item.type === 'hair' ? { hairStyle: item.value } : { clothingColor: item.value }),
              }
              return (
                <div key={item.id}
                  className={`pixel-card p-4 cursor-pointer transition-all ${isEquipped ? 'border-sky-500' : 'hover:border-gray-600'}`}
                  onMouseEnter={() => setHoverChar(previewChar)}
                  onMouseLeave={() => setHoverChar(null)}>
                  <div className="text-white font-semibold mb-1" style={{ fontSize: '14px' }}>{item.name}</div>
                  <div className="text-gray-500 mb-3" style={{ fontSize: '12px' }}>{item.description}</div>
                  {isEquipped ? (
                    <span className="pixel-font text-sky-400" style={{ fontSize: '12px' }}>Equipped</span>
                  ) : owned ? (
                    <button onClick={() => handleEquip(item)}
                      className="pixel-btn bg-sky-800 border-sky-600 text-white px-3 py-1 w-full" style={{ fontSize: '12px' }}>
                      Equip
                    </button>
                  ) : (
                    <button onClick={() => handleBuy(item)}
                      disabled={buying === item.id || points < item.price}
                      className={`pixel-btn px-3 py-1 w-full ${points < item.price ? 'bg-gray-800 border-gray-700 text-gray-600' : 'bg-yellow-700 border-yellow-600 text-white'}`}
                      style={{ fontSize: '12px' }}>
                      {item.price} pts
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'pets' && (
        <div>
          <p className="text-gray-500 mb-6" style={{ fontSize: '13px' }}>
            Regular pets cost <span className="text-yellow-400 font-semibold">Points</span>.
            Special pets cost <span className="text-purple-400 font-semibold">PR Points</span> — earned every time you beat a personal record.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PETS.map(pet => {
              const owned     = ownedPets.includes(pet.id)
              const active    = activePet === pet.id
              const isPR      = pet.costType === 'pr_points'
              const balance   = isPR ? prPoints : points
              const canAfford = balance >= pet.cost

              return (
                <div key={pet.id}
                  className={`pixel-card p-4 flex flex-col items-center text-center transition-all ${active ? 'border-purple-500' : ''}`}>
                  <div className="mb-3">
                    <PetSprite petId={pet.id} size={100} />
                  </div>
                  <div className="text-white font-semibold mb-1" style={{ fontSize: '14px' }}>{pet.name}</div>
                  <div className="text-gray-500 mb-3" style={{ fontSize: '12px' }}>{pet.desc}</div>

                  <div className={`pixel-font mb-3 px-2 py-1 rounded-lg ${isPR ? 'glass-option text-purple-400' : 'glass-option text-yellow-400'}`}
                    style={{ fontSize: '11px' }}>
                    {pet.cost} {isPR ? 'PR pts' : 'pts'}
                  </div>

                  {owned ? (
                    <button onClick={() => handleEquipPet(pet.id)}
                      className={`pixel-btn px-4 py-2 w-full ${active ? 'bg-purple-800 border-purple-600 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                      style={{ fontSize: '12px' }}>
                      {active ? 'Active' : 'Equip'}
                    </button>
                  ) : (
                    <button onClick={() => handleBuyPet(pet)}
                      disabled={buying === pet.id || !canAfford}
                      className={`pixel-btn px-4 py-2 w-full ${!canAfford ? 'bg-gray-800 border-gray-700 text-gray-600' : isPR ? 'bg-purple-800 border-purple-600 text-white' : 'bg-yellow-700 border-yellow-600 text-white'}`}
                      style={{ fontSize: '12px' }}>
                      {buying === pet.id ? 'Adopting...' : !canAfford ? `Need ${pet.cost - balance} more` : 'Adopt'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
