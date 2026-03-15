// XP and leveling system
export const XP_PER_SET = 10
export const XP_PER_WORKOUT = 50
export const POINTS_PER_WORKOUT = 25

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function getLevelFromXP(totalXP) {
  let level = 1
  let remaining = totalXP
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level++
  }
  return { level, currentXP: remaining, xpNeeded: xpForLevel(level) }
}

export function calcWorkoutXP(sets) {
  return XP_PER_WORKOUT + (sets * XP_PER_SET)
}

export function calcWorkoutPoints(sets) {
  return POINTS_PER_WORKOUT + Math.floor(sets / 3) * 5
}

export const LEVEL_TITLES = [
  'Newbie', 'Rookie', 'Beginner', 'Trainee', 'Amateur',
  'Athlete', 'Warrior', 'Champion', 'Elite', 'Legend',
  'Master', 'Grand Master', 'Titan', 'Demigod', 'GOD'
]

export function getLevelTitle(level) {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1)
  return LEVEL_TITLES[idx]
}

// Progressive overload recommendation
export function getRecommendation(lastWeight, lastReps, lastSets) {
  if (!lastWeight) return null

  // If they hit target reps on all sets, increase weight
  if (lastReps >= 12) {
    return {
      weight: Math.ceil((lastWeight * 1.05) / 2.5) * 2.5,
      reps: 8,
      sets: lastSets,
      reason: 'You hit your rep target! Time to increase weight by ~5%.'
    }
  }
  // If they got good reps, add a rep
  if (lastReps >= 8) {
    return {
      weight: lastWeight,
      reps: lastReps + 1,
      sets: lastSets,
      reason: 'Great work! Try adding 1 more rep this session.'
    }
  }
  // Maintain
  return {
    weight: lastWeight,
    reps: lastReps,
    sets: lastSets,
    reason: 'Focus on form and hit the same numbers again.'
  }
}
