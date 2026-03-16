import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(str) {
  if (!str) return null
  return new Date(str).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

function buildShareText(workout) {
  const date = new Date(workout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const lines = [date, '']
  ;(workout.exercises || []).forEach(ex => {
    lines.push(ex.name)
    ;(ex.sets || []).forEach(s => {
      const note = s.note ? ` ${s.note}` : ''
      lines.push(`${s.weight}lb x ${s.reps}${note}`)
    })
    lines.push('')
  })
  return lines.join('\n').trimEnd()
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ url, workoutName, discordWebhook, onClose }) {
  const [copied, setCopied] = useState(false)
  const [discordSent, setDiscordSent] = useState(false)

  async function handleNativeShare() {
    const shareText = `Check out my workout photo!\n${window.location.origin}${url}`
    if (navigator.share) {
      try { await navigator.share({ title: workoutName, text: shareText }) } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareText).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDiscord() {
    if (!discordWebhook) return alert('Add your Discord webhook in the Friends page first.')
    try {
      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `**${workoutName}**\n${window.location.origin}${url}` }),
      })
      setDiscordSent(true)
      setTimeout(() => setDiscordSent(false), 2000)
    } catch (_) {
      alert('Failed to send to Discord.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative max-w-2xl w-full px-4">
        <button onClick={onClose}
          className="absolute top-0 right-4 text-gray-400 hover:text-white text-2xl z-10 bg-black/60 rounded-full w-10 h-10 flex items-center justify-center">
          ✕
        </button>
        <img src={url} alt="Workout" className="w-full max-h-[65vh] object-contain rounded" />
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          <button onClick={handleNativeShare}
            className="pixel-btn bg-blue-800 border-blue-600 text-white px-5 py-2" style={{ fontSize: '13px' }}>
            Share via Messages
          </button>
          <button onClick={handleDiscord}
            className="pixel-btn bg-indigo-800 border-indigo-600 text-white px-5 py-2" style={{ fontSize: '13px' }}>
            {discordSent ? 'Sent!' : 'Send to Discord'}
          </button>
          <button onClick={handleCopy}
            className="pixel-btn bg-gray-800 border-gray-600 text-white px-5 py-2" style={{ fontSize: '13px' }}>
            {copied ? 'Copied!' : 'Copy Photo Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Workout Detail Modal ─────────────────────────────────────────────────────
function WorkoutDetail({ workout, discordWebhook, onClose, onDelete }) {
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [discordSent, setDiscordSent] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalSets = (workout.exercises || []).reduce((a, e) => a + (e.sets?.length || 0), 0)

  async function handleCopyText() {
    await navigator.clipboard.writeText(buildShareText(workout))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNativeShare() {
    const text = buildShareText(workout)
    if (navigator.share) {
      try { await navigator.share({ title: workout.name, text }) } catch (_) {}
    } else {
      handleCopyText()
    }
  }

  async function handleDiscordShare() {
    if (!discordWebhook) return alert('Add your Discord webhook in the Friends page first.')
    try {
      const text = buildShareText(workout)
      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      setDiscordSent(true)
      setTimeout(() => setDiscordSent(false), 2000)
    } catch (_) {}
  }

  async function handleDelete() {
    if (!confirm('Delete this workout? XP will be reversed.')) return
    setDeleting(true)
    try {
      await api.deleteWorkout(workout.id)
      onDelete(workout.id)
      onClose()
    } catch (e) {
      alert('Error deleting: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-2 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pixel-card w-full max-w-lg flex flex-col" style={{ background: '#0d0d1f', maxHeight: '90vh' }}>

          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex justify-between items-start">
            <div>
              <h2 className="text-white font-medium" style={{ fontSize: '16px' }}>{workout.name}</h2>
              <p className="text-gray-500 text-xs mt-0.5">{formatDate(workout.created_at)}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl ml-4 flex-shrink-0">✕</button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'XP Earned', value: `+${workout.xp_earned || 0}`, color: 'text-sky-400' },
                { label: 'Exercises', value: workout.exercises?.length || 0, color: 'text-green-400' },
                { label: 'Total Sets', value: totalSets, color: 'text-yellow-400' },
              ].map(s => (
                <div key={s.label} className="bg-black/40 border border-gray-800 p-3 text-center">
                  <div className={`pixel-font ${s.color}`} style={{ fontSize: '14px' }}>{s.value}</div>
                  <div className="text-gray-600 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Time info */}
            {(workout.start_time || workout.duration_minutes) && (
              <div className="flex gap-4 glass-row p-3 text-xs text-gray-400">
                {workout.start_time && <span>Start: {formatTime(workout.start_time)}</span>}
                {workout.end_time && <span>End: {formatTime(workout.end_time)}</span>}
                {workout.duration_minutes && <span>Duration: {workout.duration_minutes} min</span>}
              </div>
            )}

            {/* Exercises */}
            <div>
              <div className="pixel-font text-gray-500 mb-3" style={{ fontSize: '12px' }}>EXERCISES</div>
              <div className="flex flex-col gap-3">
                {(workout.exercises || []).map((ex, i) => (
                  <div key={i} className="bg-black/40 border border-gray-800 p-3">
                    <div className="text-white font-medium mb-2" style={{ fontSize: '13px' }}>{ex.name}</div>
                    <div className="flex flex-col gap-1">
                      {(ex.sets || []).map((set, j) => (
                        <div key={j} className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600 w-5">{j + 1}</span>
                          <span className="text-gray-300">{set.weight} lbs</span>
                          <span className="text-gray-600">×</span>
                          <span className="text-gray-300">{set.reps} reps</span>
                          {set.note && <span className="text-gray-500 italic">— {set.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {workout.notes && (
              <div>
                <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '12px' }}>NOTES</div>
                <div className="bg-black/40 border border-gray-800 p-3 text-gray-300" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {workout.notes}
                </div>
              </div>
            )}

            {/* Photo */}
            {workout.photo_url && (
              <div>
                <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '12px' }}>WORKOUT PHOTO</div>
                <div className="relative">
                  <img
                    src={workout.photo_url}
                    alt="Workout"
                    className="w-full rounded border border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '280px', objectFit: 'cover' }}
                    onClick={() => setLightboxUrl(workout.photo_url)}
                  />
                  <button
                    onClick={() => setLightboxUrl(workout.photo_url)}
                    className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 border border-gray-600 hover:border-sky-500 transition-all"
                    style={{ fontSize: '13px' }}>
                    View & Share Photo
                  </button>
                </div>
              </div>
            )}

            {/* Share workout text */}
            <div>
              <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '12px' }}>SHARE WORKOUT</div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleDiscordShare}
                  className="flex-1 pixel-btn bg-indigo-800 border-indigo-600 text-white py-2" style={{ fontSize: '12px' }}>
                  {discordSent ? 'Sent!' : 'Discord'}
                </button>
                <button onClick={handleNativeShare}
                  className="flex-1 pixel-btn bg-blue-800 border-blue-600 text-white py-2" style={{ fontSize: '12px' }}>
                  Messages
                </button>
                <button onClick={handleCopyText}
                  className="flex-1 pixel-btn bg-gray-800 border-gray-600 text-white py-2" style={{ fontSize: '12px' }}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800 flex justify-between items-center">
            <button onClick={handleDelete} disabled={deleting}
              className="text-gray-600 hover:text-red-400 transition-colors text-sm disabled:opacity-40">
              {deleting ? 'Deleting...' : 'Delete Workout'}
            </button>
            <button onClick={onClose}
              className="pixel-btn bg-sky-800 border-sky-600 text-white px-5 py-2" style={{ fontSize: '12px' }}>
              Close
            </button>
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div style={{ zIndex: 60, position: 'fixed', inset: 0 }}>
          <PhotoLightbox
            url={lightboxUrl}
            workoutName={workout.name}
            discordWebhook={discordWebhook}
            onClose={() => setLightboxUrl(null)}
          />
        </div>
      )}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkoutLogs() {
  const { profile, refreshProfile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchWorkouts() }, [])

  async function fetchWorkouts() {
    try {
      const data = await api.getWorkouts()
      setWorkouts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    setWorkouts(prev => prev.filter(w => w.id !== id))
    await refreshProfile()
  }

  // Group by month
  const grouped = workouts.reduce((acc, w) => {
    const key = new Date(w.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Workout Log</h1>
        <span className="text-gray-600 text-xs">{workouts.length} workouts total</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-800">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500">No workouts logged yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([month, monthWorkouts]) => (
            <div key={month}>
              <div className="pixel-font text-gray-600 mb-3 pb-1 border-b border-gray-800" style={{ fontSize: '12px' }}>
                {month.toUpperCase()} · {monthWorkouts.length} WORKOUT{monthWorkouts.length !== 1 ? 'S' : ''}
              </div>
              <div className="flex flex-col gap-2">
                {monthWorkouts.map(w => {
                  const totalSets = (w.exercises || []).reduce((a, e) => a + (e.sets?.length || 0), 0)
                  return (
                    <button
                      key={w.id}
                      onClick={() => setSelected(w)}
                      className="w-full text-left pixel-card p-4 hover:border-sky-700 transition-all group"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium group-hover:text-sky-300 transition-colors" style={{ fontSize: '14px' }}>
                            {w.name}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {formatDate(w.created_at)}
                            {w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            {w.exercises?.length || 0} exercises · {totalSets} sets
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                          <span className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>+{w.xp_earned || 0} XP</span>
                          {w.photo_url && (
                            <span className="text-gray-600 text-xs">📷 photo</span>
                          )}
                        </div>
                      </div>
                      {/* Exercise preview */}
                      {w.exercises?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {w.exercises.slice(0, 4).map((ex, i) => (
                            <span key={i} className="text-gray-600 glass-row px-2 py-0.5" style={{ fontSize: '13px' }}>
                              {ex.name}
                            </span>
                          ))}
                          {w.exercises.length > 4 && (
                            <span className="text-gray-700" style={{ fontSize: '13px' }}>+{w.exercises.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <WorkoutDetail
          workout={selected}
          discordWebhook={profile?.discord_webhook}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
