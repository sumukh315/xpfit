const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

function getToken() {
  return localStorage.getItem('xpfit_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body instanceof FormData ? options.body :
          options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),

  // Workouts
  getWorkouts: () => request('/workouts'),
  getFriendWorkouts: (userId) => request(`/workouts/user/${userId}`),
  createWorkout: (data) => {
    // Use FormData for photo upload support
    const form = new FormData()
    form.append('name', data.name)
    form.append('exercises', JSON.stringify(data.exercises))
    form.append('notes', data.notes || '')
    form.append('xp_earned', data.xp_earned)
    form.append('points_earned', data.points_earned)
    if (data.start_time) form.append('start_time', data.start_time)
    if (data.end_time) form.append('end_time', data.end_time)
    if (data.duration_minutes) form.append('duration_minutes', data.duration_minutes)
    if (data.photo) form.append('photo', data.photo)
    return request('/workouts', { method: 'POST', body: form })
  },
  importWorkouts: (workouts) => request('/workouts/import', { method: 'POST', body: { workouts } }),
  updateWorkout: (id, data) => request(`/workouts/${id}`, { method: 'PATCH', body: data }),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),
  addWorkoutPhoto: (id, photoFile) => {
    const form = new FormData()
    form.append('photo', photoFile)
    return request(`/workouts/${id}/photo`, { method: 'PATCH', body: form })
  },

  // Profiles
  updateProfile: (data) => request('/profiles/me', { method: 'PATCH', body: data }),
  searchUsers: (q) => request(`/profiles/search?q=${encodeURIComponent(q)}`),
  getProfile: (id) => request(`/profiles/${id}`),

  // Auth extras
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),

  // Social
  getFriends: () => request('/social/friends'),
  getSuggestedFriends: () => request('/social/suggested'),
  getFriendRequests: () => request('/social/requests'),
  getPendingRequests: () => request('/social/pending'),
  sendFriendRequest: (id) => request(`/social/request/${id}`, { method: 'POST' }),
  acceptFriendRequest: (id) => request(`/social/accept/${id}`, { method: 'POST' }),
  getFriendFriends: (userId) => request(`/social/friends/${userId}`),
  sendFeedback: (data) => request('/feedback', { method: 'POST', body: data }),
}
