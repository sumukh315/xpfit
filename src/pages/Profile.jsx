import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'
import PetSprite from '../components/PetSprite'
import { CLASSES, CLASS_INFO } from '../lib/pixelCharacter'
import { PETS } from '../lib/pets'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [character, setCharacter] = useState(profile?.character || {})
  const [saving, setSaving] = useState(false)

  // Discord integration state
  const [discordWebhook, setDiscordWebhook] = useState(profile?.discord_webhook || '')
  const [savingDiscord, setSavingDiscord] = useState(false)
  const [discordSaved, setDiscordSaved] = useState(false)

  // Feedback state
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  async function sendFeedback() {
    if (!feedbackMessage.trim()) return
    setSendingFeedback(true)
    setFeedbackError('')
    try {
      await api.sendFeedback({ email: feedbackEmail, message: feedbackMessage })
      setFeedbackSent(true)
      setFeedbackEmail('')
      setFeedbackMessage('')
      setTimeout(() => setFeedbackSent(false), 4000)
    } catch (e) {
      setFeedbackError('Failed to send. Try again.')
    } finally {
      setSendingFeedback(false)
    }
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
        <div className="flex flex-col items-center gap-3">
          <div className="pixel-card p-5 glow-purple">
            <PixelCharacter options={displayChar} scale={1} />
          </div>
          {/* Pet square */}
          {profile?.active_pet ? (
            <div className="pixel-card p-2 flex flex-col items-center justify-center" style={{ width: 80, height: 80 }}>
              <PetSprite petId={profile.active_pet} size={60} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-gray-700 rounded-xl text-center"
              style={{ width: 80, height: 80, padding: 6 }}>
              <div className="text-gray-600" style={{ fontSize: '18px' }}>🐾</div>
              <div className="text-gray-600 leading-tight mt-1" style={{ fontSize: '9px' }}>Visit Shop</div>
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="pixel-font text-white mb-1" style={{ fontSize: '20px' }}>{profile?.username}</h2>
          <p className="pixel-font text-sky-400 mb-1" style={{ fontSize: '13px' }}>Level {level} · {getLevelTitle(level)}</p>
          <p className="text-gray-400 mb-4 capitalize" style={{ fontSize: '12px' }}>
            {charOptions.gender || 'Male'} · {CLASS_INFO[charOptions.charClass]?.label || 'Warrior'}
          </p>
          <XPBar totalXP={profile?.total_xp || 0} />
          <div className="flex gap-6 mt-4 justify-center md:justify-start">
            <div>
              <div className="pixel-font text-yellow-400" style={{ fontSize: '16px' }}>{profile?.points || 0}</div>
              <div className="text-gray-600 text-xs">Points</div>
            </div>
            <div>
              <div className="pixel-font text-sky-400" style={{ fontSize: '16px' }}>{profile?.total_xp || 0}</div>
              <div className="text-gray-600 text-xs">Total XP</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pixel-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Change Character</h2>
          {!editing ? (
            <button onClick={() => { setCharacter(profile?.character || {}); setEditing(true) }}
              className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-2" style={{ fontSize: '12px' }}>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="pixel-btn bg-gray-800 border-gray-600 text-gray-300 px-3 py-1" style={{ fontSize: '12px' }}>Cancel</button>
              <button onClick={saveCharacter} disabled={saving} className="pixel-btn bg-green-700 border-green-500 text-white px-4 py-1" style={{ fontSize: '12px' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-4">

            <div className="mb-4">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '13px' }}>GENDER</label>
              <div className="flex gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => updateChar('gender', g)}
                    className={`px-4 py-1 capitalize text-xs ${character.gender === g ? 'glass-option-active text-sky-300' : 'glass-option text-gray-500'}`}>
                    {g === 'male' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '13px' }}>CLASS</label>
              <div className="grid grid-cols-3 gap-2">
                {CLASSES.map(cls => {
                  const info = CLASS_INFO[cls]
                  const selected = character.charClass === cls
                  const unlockedClasses = profile?.unlocked_classes || ['warrior', 'mage']
                  const unlocked = unlockedClasses.includes(cls)
                  return (
                    <button key={cls}
                      onClick={() => unlocked && updateChar('charClass', cls)}
                      disabled={!unlocked}
                      className={`py-2 px-2 transition-all text-left relative ${
                        !unlocked ? 'glass-option opacity-40 cursor-not-allowed' :
                        selected ? 'glass-option-active' : 'glass-option'
                      }`}>
                      {!unlocked && (
                        <div className="absolute top-1 right-1 text-gray-600" style={{ fontSize: '12px' }}>🔒</div>
                      )}
                      <div className={`pixel-font ${selected ? 'text-sky-300' : unlocked ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: '12px' }}>{info.label}</div>
                      <div className={`${unlocked ? 'text-gray-500' : 'text-gray-700'}`} style={{ fontSize: '13px' }}>
                        {unlocked ? info.desc : 'Not yet unlocked'}
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
              <div key={label} className="flex justify-between glass-row p-2">
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
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Discord Integration</h2>
          <span className={`pixel-font text-xs px-2 py-1 rounded-lg ${profile?.discord_webhook ? 'glass-option-active text-green-400' : 'glass-option text-gray-500'}`} style={{ fontSize: '12px' }}>
            {profile?.discord_webhook ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <p className="text-gray-500 mb-4" style={{ fontSize: '13px' }}>
          Get notified in Discord every time you complete a workout. Paste your webhook URL below to connect.
        </p>

        <div className="glass-row p-3 mb-4 rounded">
          <p className="pixel-font text-gray-400 mb-1" style={{ fontSize: '13px' }}>HOW TO GET YOUR WEBHOOK URL</p>
          <p className="text-gray-500" style={{ fontSize: '13px' }}>
            Discord server → Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={discordWebhook}
            onChange={e => setDiscordWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="glass-input flex-1"
            style={{ fontSize: '12px' }}
          />
          <button
            onClick={saveDiscordWebhook}
            disabled={savingDiscord}
            className="pixel-btn bg-sky-800 border-sky-600 text-white px-4 py-2 disabled:opacity-50"
            style={{ fontSize: '12px' }}>
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
            style={{ fontSize: '13px' }}>
            Remove webhook
          </button>
        )}
      </div>

      {/* Feedback */}
      <div className="pixel-card p-5 mt-6">
        <h2 className="pixel-font text-sky-400 mb-1" style={{ fontSize: '13px' }}>Send Feedback</h2>
        <p className="text-gray-400 mb-4" style={{ fontSize: '12px' }}>Have a suggestion or found a bug? Let us know.</p>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={feedbackEmail}
            onChange={e => setFeedbackEmail(e.target.value)}
            placeholder="Your email (optional)"
            className="glass-input"
            style={{ fontSize: '13px' }}
          />
          <textarea
            value={feedbackMessage}
            onChange={e => setFeedbackMessage(e.target.value)}
            placeholder="Your message..."
            rows={4}
            className="glass-input"
            style={{ fontSize: '13px', resize: 'vertical' }}
          />
          {feedbackError && <p className="text-red-400 text-xs">{feedbackError}</p>}
          <button
            onClick={sendFeedback}
            disabled={sendingFeedback || !feedbackMessage.trim()}
            className="pixel-btn bg-sky-800 border-sky-600 text-white py-2 disabled:opacity-40"
            style={{ fontSize: '13px' }}>
            {sendingFeedback ? 'Sending...' : feedbackSent ? 'Sent! Thanks!' : 'Send Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
