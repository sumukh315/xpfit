import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import PetSprite from '../components/PetSprite'
import { PETS } from '../lib/pets'

export default function Shop() {
  const { profile, refreshProfile } = useAuth()
  const [buying, setBuying] = useState(null)
  const [message, setMessage] = useState('')

  const ownedPets = profile?.owned_pets || []
  const activePet = profile?.active_pet || null
  const points    = profile?.points     || 0
  const prPoints  = profile?.pr_points  || 0

  function flash(msg) { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Pet Shop</h1>
        <div className="flex gap-4">
          <span className="pixel-font text-yellow-400" style={{ fontSize: '13px' }}>{points} pts</span>
          <span className="pixel-font text-purple-400" style={{ fontSize: '13px' }}>{prPoints} PR pts</span>
        </div>
      </div>

      <p className="text-gray-500 mb-6" style={{ fontSize: '13px' }}>
        Regular pets cost <span className="text-yellow-400 font-semibold">Points</span>.
        Special pets cost <span className="text-purple-400 font-semibold">PR Points</span> — earned every time you beat a personal record.
      </p>

      {message && (
        <div className="pixel-card p-3 mb-4 text-center text-green-400 pixel-font" style={{ fontSize: '12px' }}>{message}</div>
      )}

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
  )
}
