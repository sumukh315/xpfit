import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'
import { CLASSES, CLASS_INFO, getUnlockedClasses } from '../lib/pixelCharacter'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [character, setCharacter] = useState(profile?.character || {})
  const [saving, setSaving] = useState(false)

  // Discord integration state
  const [discordWebhook, setDiscordWebhook] = useState(profile?.discord_webhook || '')
  const [savingDiscord, setSavingDiscord] = useState(false)
  const [discordSaved, setDiscordSaved] = useState(false)

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

  const { level } = getLevelFromXP(profile?.total_xp || 0)
  const charOptions = profile?.character || {}

  function updateChar(key, value) {
    setCharacter(prev => ({ ...prev, [key]: value }))
  }

  async function saveCharacter() {
    setSaving(true)
    try {
      await api.updateProfile({ character })
      await refreshProfile()
      setEditing(false)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const displayChar = editing ? character : charOptions

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>Profile</h1>

      <div className="pixel-card p-6 mb-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="pixel-card p-5 glow-purple">
          <PixelCharacter options={displayChar} scale={1} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="pixel-font text-white mb-1" style={{ fontSize: '20px' }}>{profile?.username}</h2>
          <p className="pixel-font text-sky-400 mb-1" style={{ fontSize: '11px' }}>Level {level} · {getLevelTitle(level)}</p>
          <p className="text-gray-400 mb-4 capitalize" style={{ fontSize: '12px' }}>
            {charOptions.gender || 'Male'} · {CLASS_INFO[charOptions.charClass]?.label || 'Warrior'}
          </p>
          <XPBar totalXP={profile?.total_xp || 0} />
          <div className="flex gap-6 mt-4 justify-center md:justify-start">
            <div>
              <div className="pixel-font text-yellow-400" style={{ fontSize: '16px' }}>🪙 {profile?.points || 0}</div>
              <div className="text-gray-600 text-xs">Points</div>
            </div>
            <div>
              <div className="pixel-font text-sky-400" style={{ fontSize: '16px' }}>⭐ {profile?.total_xp || 0}</div>
              <div className="text-gray-600 text-xs">Total XP</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pixel-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '10px' }}>Change Character</h2>
          {!editing ? (
            <button onClick={() => { setCharacter(profile?.character || {}); setEditing(true) }}
              className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-2" style={{ fontSize: '8px' }}>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="pixel-btn bg-gray-800 border-gray-600 text-gray-300 px-3 py-1" style={{ fontSize: '8px' }}>Cancel</button>
              <button onClick={saveCharacter} disabled={saving} className="pixel-btn bg-green-700 border-green-500 text-white px-4 py-1" style={{ fontSize: '8px' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-4">

            <div className="mb-4">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '7px' }}>GENDER</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => updateChar('gender', g)}
                    className={`px-4 py-1 capitalize text-xs border-2 ${character.gender === g ? 'border-sky-400 bg-sky-900/40 text-white' : 'border-gray-700 text-gray-500'}`}>
                    {g === 'male' ? '⚔ Male' : '✦ Female'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '7px' }}>CLASS</label>
              <div className="grid grid-cols-3 gap-2">
                {CLASSES.map(cls => {
                  const info = CLASS_INFO[cls]
                  const selected = character.charClass === cls
                  const unlocked = info.unlockLevel <= level
                  return (
                    <button key={cls}
                      onClick={() => unlocked && updateChar('charClass', cls)}
                      disabled={!unlocked}
                      className={`py-2 px-2 border-2 transition-all text-left relative ${
                        !unlocked ? 'border-gray-800 bg-black/10 opacity-50 cursor-not-allowed' :
                        selected ? 'border-sky-400 bg-sky-900/40' : 'border-gray-700 hover:border-gray-500 bg-black/20'
                      }`}>
                      {!unlocked && (
                        <div className="absolute top-1 right-1 text-gray-600" style={{ fontSize: '9px' }}>🔒</div>
                      )}
                      <div className={`pixel-font ${selected ? 'text-sky-300' : unlocked ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: '8px' }}>{info.label}</div>
                      <div className={`${unlocked ? 'text-gray-500' : 'text-gray-700'}`} style={{ fontSize: '10px' }}>
                        {unlocked ? info.desc : `Unlock at Lv ${info.unlockLevel}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Gender', charOptions.gender],
              ['Class',  CLASS_INFO[charOptions.charClass]?.label || charOptions.charClass],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between bg-black/30 p-2 border border-gray-800">
                <span className="text-gray-500 capitalize">{label}</span>
                <span className="text-white capitalize">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discord Integration */}
      <div className="pixel-card p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '10px' }}>Discord Integration</h2>
          <span className={`pixel-font text-xs px-2 py-1 border ${profile?.discord_webhook ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-500'}`} style={{ fontSize: '8px' }}>
            {profile?.discord_webhook ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <p className="text-gray-500 mb-4" style={{ fontSize: '11px' }}>
          Get notified in Discord every time you complete a workout. Paste your webhook URL below to connect.
        </p>

        <div className="bg-black/30 border border-gray-800 p-3 mb-4 rounded">
          <p className="pixel-font text-gray-400 mb-1" style={{ fontSize: '7px' }}>HOW TO GET YOUR WEBHOOK URL</p>
          <p className="text-gray-500" style={{ fontSize: '11px' }}>
            Discord server → Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={discordWebhook}
            onChange={e => setDiscordWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
            style={{ fontSize: '12px' }}
          />
          <button
            onClick={saveDiscordWebhook}
            disabled={savingDiscord}
            className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-2 disabled:opacity-50"
            style={{ fontSize: '8px' }}>
            {savingDiscord ? 'Saving...' : discordSaved ? 'Saved!' : 'Save'}
          </button>
        </div>
        {(profile?.discord_webhook) && (
          <button
            onClick={async () => {
              setSavingDiscord(true)
              try {
                await api.updateProfile({ discord_webhook: null })
                setDiscordWebhook('')
                await refreshProfile()
              } catch (e) { console.error(e) }
              finally { setSavingDiscord(false) }
            }}
            className="text-gray-600 hover:text-red-400 text-xs mt-2 transition-colors"
            style={{ fontSize: '11px' }}>
            Remove webhook
          </button>
        )}
      </div>
    </div>
  )
}
