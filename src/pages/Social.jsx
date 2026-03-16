import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'

function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function ActivityBadge({ days }) {
  if (days === null) return <span className="text-gray-600 text-xs">No workouts</span>
  if (days === 0) return <span className="text-green-400 pixel-font" style={{ fontSize: '8px' }}>Active today</span>
  if (days === 1) return <span className="text-green-400 pixel-font" style={{ fontSize: '8px' }}>Active yesterday</span>
  if (days <= 3) return <span className="text-yellow-400 pixel-font" style={{ fontSize: '8px' }}>{days} days ago</span>
  return <span className="text-red-400 pixel-font" style={{ fontSize: '8px' }}>{days} days ago</span>
}

export default function Social() {
  const { profile, refreshProfile } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [pending, setPending] = useState([])
  const [suggested, setSuggested] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [friendWorkouts, setFriendWorkouts] = useState([])
  const [friendLastWorkout, setFriendLastWorkout] = useState({})

  // Discord
  const [discordWebhook, setDiscordWebhook] = useState(profile?.discord_webhook || '')
  const [savingDiscord, setSavingDiscord] = useState(false)
  const [discordSaved, setDiscordSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchFriends()
      fetchRequests()
      fetchPending()
      fetchSuggested()
      setDiscordWebhook(profile.discord_webhook || '')
    }
  }, [profile])

  async function fetchFriends() {
    try {
      const data = await api.getFriends()
      setFriends(data)
      // Fetch last workout date for each friend
      const lastWorkouts = {}
      await Promise.all(data.map(async f => {
        try {
          const workouts = await api.getFriendWorkouts(f.id)
          lastWorkouts[f.id] = workouts[0]?.created_at || null
        } catch (_) {}
      }))
      setFriendLastWorkout(lastWorkouts)
    } catch (e) { console.error(e) }
  }

  async function fetchRequests() {
    try { setRequests(await api.getFriendRequests()) } catch (e) { console.error(e) }
  }

  async function fetchPending() {
    try { setPending(await api.getPendingRequests()) } catch (e) { console.error(e) }
  }

  async function fetchSuggested() {
    try { setSuggested(await api.getSuggestedFriends()) } catch (e) { console.error(e) }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return
    try { setSearchResults(await api.searchUsers(searchQuery)) } catch (e) { console.error(e) }
  }

  async function sendRequest(id, username) {
    try {
      await api.sendFriendRequest(id)
      setSearchResults(prev => prev.filter(u => u.id !== id))
      setSuggested(prev => prev.filter(u => u.id !== id))
      setPending(prev => [...prev, { id, username }])
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

  async function saveDiscordWebhook() {
    setSavingDiscord(true)
    setDiscordSaved(false)
    try {
      await api.updateProfile({ discord_webhook: discordWebhook || null })
      await refreshProfile()
      setDiscordSaved(true)
      setTimeout(() => setDiscordSaved(false), 3000)
    } catch (e) { console.error(e) }
    finally { setSavingDiscord(false) }
  }

  async function nudgeFriend(friend) {
    if (!profile?.discord_webhook) return alert('Connect your Discord first to send nudges!')
    const days = daysSince(friendLastWorkout[friend.id])
    const msg = days === null
      ? `Hey! Remind ${friend.username} to start logging their workouts on XPFit!`
      : `${friend.username} hasn't worked out in ${days} days — time to get back at it!`
    try {
      await fetch(profile.discord_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      })
    } catch (_) {}
  }

  if (selectedFriend) {
    const { level } = getLevelFromXP(selectedFriend.total_xp || 0)
    const charOptions = selectedFriend.character || { gender: 'male', charClass: 'warrior' }
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => setSelectedFriend(null)} className="text-sky-400 hover:text-sky-300 mb-6 flex items-center gap-2">
          Back to Friends
        </button>
        <div className="pixel-card p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="pixel-card p-4 glow-purple flex-shrink-0">
            <PixelCharacter options={charOptions} scale={0.9} />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="pixel-font text-white mb-1" style={{ fontSize: '16px' }}>{selectedFriend.username}</h2>
            <p className="pixel-font text-sky-400 mb-3" style={{ fontSize: '10px' }}>Level {level} {getLevelTitle(level)}</p>
            <XPBar totalXP={selectedFriend.total_xp || 0} />
            <p className="text-yellow-400 pixel-font mt-2" style={{ fontSize: '9px' }}>{selectedFriend.points || 0} Points</p>
          </div>
        </div>
        <div className="pixel-card p-4">
          <h3 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '10px' }}>Recent Workouts</h3>
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
                      {w.notes && <div className="text-gray-400 text-xs mt-1 italic">{w.notes}</div>}
                    </div>
                    <span className="pixel-font text-sky-400 flex-shrink-0 ml-2" style={{ fontSize: '9px' }}>+{w.xp_earned} XP</span>
                  </div>
                  {w.photo_url && <img src={w.photo_url} alt="Workout" className="mt-3 w-full max-h-48 object-cover border border-gray-700" />}
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
      <h1 className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>Friends & Social</h1>

      {/* Discord Connection */}
      <div className="pixel-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '10px' }}>Discord</h2>
          <span className={`pixel-font px-2 py-1 border ${profile?.discord_webhook ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-500'}`} style={{ fontSize: '8px' }}>
            {profile?.discord_webhook ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <p className="text-gray-500 mb-3" style={{ fontSize: '11px' }}>
          Connect a Discord channel to share workouts manually with the Share button.
          <br />
          To get a webhook: Discord server → Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
        </p>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input type="url" value={discordWebhook} onChange={e => setDiscordWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
            style={{ fontSize: '12px' }} />
          <button onClick={saveDiscordWebhook} disabled={savingDiscord}
            className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-2 disabled:opacity-50"
            style={{ fontSize: '8px' }}>
            {savingDiscord ? 'Saving...' : discordSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Find Players */}
        <div className="pixel-card p-4">
          <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '10px' }}>Find Players</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Search username..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
              className="flex-1 bg-black/40 border border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none text-sm" />
            <button onClick={searchUsers} className="pixel-btn bg-sky-700 border-sky-500 text-white px-4 py-2" style={{ fontSize: '9px' }}>Search</button>
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
                  <button onClick={() => sendRequest(u.id, u.username)} className="pixel-btn bg-green-800 border-green-600 text-white px-3 py-1" style={{ fontSize: '8px' }}>+ Add</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Friend Requests */}
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

      {/* Pending sent requests */}
      {pending.length > 0 && (
        <div className="pixel-card p-4 mb-6">
          <h2 className="pixel-font text-gray-500 mb-3" style={{ fontSize: '10px' }}>WAITING FOR RESPONSE ({pending.length})</h2>
          <div className="flex flex-wrap gap-2">
            {pending.map(u => (
              <div key={u.id} className="flex items-center gap-2 bg-black/40 border border-gray-800 px-3 py-2">
                <span className="text-gray-400 text-sm">{u.username}</span>
                <span className="pixel-font text-gray-600" style={{ fontSize: '7px' }}>Request sent</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People You May Know */}
      {suggested.length > 0 && (
        <div className="pixel-card p-4 mb-6">
          <h2 className="pixel-font text-yellow-400 mb-4" style={{ fontSize: '10px' }}>People You May Know</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggested.map(u => {
              const { level } = getLevelFromXP(u.total_xp || 0)
              const charOpts = u.character || { gender: 'male', charClass: 'warrior' }
              return (
                <div key={u.id} className="flex items-center justify-between p-3 bg-black/30 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <PixelCharacter options={charOpts} scale={0.35} />
                    <div>
                      <div className="text-white text-sm">{u.username}</div>
                      <div className="pixel-font text-sky-400" style={{ fontSize: '8px' }}>Level {level}</div>
                      <div className="text-gray-600" style={{ fontSize: '10px' }}>Friend of a friend</div>
                    </div>
                  </div>
                  <button onClick={() => sendRequest(u.id, u.username)}
                    className="pixel-btn bg-green-800 border-green-600 text-white px-3 py-1 flex-shrink-0" style={{ fontSize: '8px' }}>
                    + Add
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Party / Friends */}
      <div className="pixel-card p-4">
        <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '10px' }}>Your Party ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No friends yet. Search for players above!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(f => {
              const { level } = getLevelFromXP(f.total_xp || 0)
              const charOpts = f.character || { gender: 'male', charClass: 'warrior' }
              const days = daysSince(friendLastWorkout[f.id])
              return (
                <div key={f.id} className="pixel-card p-4 hover:border-sky-600 transition-all">
                  <button onClick={() => viewFriend(f)} className="w-full text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <PixelCharacter options={charOpts} scale={0.45} />
                      <div>
                        <div className="text-white text-sm font-medium">{f.username}</div>
                        <div className="pixel-font text-sky-400" style={{ fontSize: '8px' }}>LVL {level}</div>
                      </div>
                    </div>
                    <XPBar totalXP={f.total_xp || 0} />
                    <div className="mt-2">
                      <ActivityBadge days={days} />
                    </div>
                  </button>
                  <button onClick={() => nudgeFriend(f)}
                    className="mt-3 w-full pixel-font text-gray-500 hover:text-yellow-400 border border-gray-800 hover:border-yellow-600 py-1 transition-all"
                    style={{ fontSize: '7px' }}>
                    Nudge on Discord
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
