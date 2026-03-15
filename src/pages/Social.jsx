import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'

export default function Social() {
  const { profile } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friendWorkouts, setFriendWorkouts] = useState([])

  useEffect(() => {
    if (profile) { fetchFriends(); fetchRequests() }
  }, [profile])

  async function fetchFriends() {
    try { setFriends(await api.getFriends()) } catch (e) { console.error(e) }
  }
  async function fetchRequests() {
    try { setRequests(await api.getFriendRequests()) } catch (e) { console.error(e) }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return
    try { setSearchResults(await api.searchUsers(searchQuery)) } catch (e) { console.error(e) }
  }

  async function sendRequest(id) {
    try {
      await api.sendFriendRequest(id)
      setSearchResults(prev => prev.filter(u => u.id !== id))
    } catch (e) { console.error(e) }
  }

  async function acceptRequest(id) {
    try {
      await api.acceptFriendRequest(id)
      fetchFriends(); fetchRequests()
    } catch (e) { console.error(e) }
  }

  async function viewFriend(friend) {
    setSelectedFriend(friend)
    try { setFriendWorkouts(await api.getFriendWorkouts(friend.id)) } catch (e) { console.error(e) }
  }

  if (selectedFriend) {
    const { level } = getLevelFromXP(selectedFriend.total_xp || 0)
    const charOptions = selectedFriend.character || { gender: 'male', charClass: 'warrior' }
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => setSelectedFriend(null)} className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2">
          ← Back to Friends
        </button>
        <div className="pixel-card p-6 mb-6 flex items-center gap-6">
          <div className="pixel-card p-4 glow-purple">
            <PixelCharacter options={charOptions} scale={0.9} />
          </div>
          <div>
            <h2 className="pixel-font text-white mb-1" style={{ fontSize: '16px' }}>{selectedFriend.username}</h2>
            <p className="pixel-font text-purple-400 mb-3" style={{ fontSize: '10px' }}>Level {level} {getLevelTitle(level)}</p>
            <XPBar totalXP={selectedFriend.total_xp || 0} />
            <p className="text-yellow-400 pixel-font mt-2" style={{ fontSize: '9px' }}>🪙 {selectedFriend.points || 0} Points</p>
          </div>
        </div>
        <div className="pixel-card p-4">
          <h3 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>Recent Workouts</h3>
          {friendWorkouts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No workouts yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {friendWorkouts.map(w => (
                <div key={w.id} className="bg-black/30 border border-gray-800 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-white font-medium">{w.name}</div>
                      <div className="text-gray-500 text-xs">{new Date(w.created_at).toLocaleDateString()} · {w.exercises?.length || 0} exercises</div>
                    </div>
                    <span className="pixel-font text-purple-400" style={{ fontSize: '9px' }}>+{w.xp_earned} XP</span>
                  </div>
                  {w.photo_url && <img src={`http://localhost:3001${w.photo_url}`} alt="Workout" className="mt-3 w-full max-h-48 object-cover border border-gray-700" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-purple-400 mb-6" style={{ fontSize: '14px' }}>Friends & Social</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="pixel-card p-4">
          <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>Find Players</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Search username..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
              className="flex-1 bg-black/40 border border-gray-700 text-white px-3 py-2 focus:border-purple-500 outline-none text-sm" />
            <button onClick={searchUsers} className="pixel-btn bg-purple-700 border-purple-500 text-white px-4 py-2" style={{ fontSize: '9px' }}>Search</button>
          </div>
          <div className="flex flex-col gap-2">
            {searchResults.map(u => {
              const charOpts = u.character || { gender: 'male', charClass: 'warrior' }
              return (
                <div key={u.id} className="flex items-center justify-between p-2 bg-black/30 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <PixelCharacter options={charOpts} scale={0.35} />
                    <div>
                      <div className="text-white text-sm">{u.username}</div>
                      <div className="text-gray-500 text-xs">Level {getLevelFromXP(u.total_xp || 0).level}</div>
                    </div>
                  </div>
                  <button onClick={() => sendRequest(u.id)} className="pixel-btn bg-green-800 border-green-600 text-white px-3 py-1" style={{ fontSize: '8px' }}>+ Add</button>
                </div>
              )
            })}
          </div>
        </div>

        {requests.length > 0 && (
          <div className="pixel-card p-4">
            <h2 className="pixel-font text-yellow-400 mb-4" style={{ fontSize: '10px' }}>Requests ({requests.length})</h2>
            <div className="flex flex-col gap-2">
              {requests.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 bg-black/30 border border-gray-800">
                  <span className="text-white text-sm">{u.username}</span>
                  <button onClick={() => acceptRequest(u.id)} className="pixel-btn bg-green-800 border-green-600 text-white px-3 py-1" style={{ fontSize: '8px' }}>Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pixel-card p-4 mt-6">
        <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>Your Party ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No friends yet. Search for players above!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map(f => {
              const { level } = getLevelFromXP(f.total_xp || 0)
              const charOpts = f.character || { gender: 'male', charClass: 'warrior' }
              return (
                <button key={f.id} onClick={() => viewFriend(f)}
                  className="pixel-card p-4 text-left hover:border-purple-600 transition-all w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <PixelCharacter options={charOpts} scale={0.45} />
                    <div>
                      <div className="text-white text-sm font-medium">{f.username}</div>
                      <div className="pixel-font text-purple-400" style={{ fontSize: '8px' }}>LVL {level}</div>
                    </div>
                  </div>
                  <XPBar totalXP={f.total_xp || 0} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
