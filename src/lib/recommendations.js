/**
 * Returns 2-3 personalized tip objects based on a user's fitness profile.
 * @param {Object} fitnessProfile
 * @returns {{ title: string, tip: string }[]}
 */
export function getRecommendations(fitnessProfile) {
  if (!fitnessProfile) return []

  const { experienceLevel, workoutTypes = [], daysPerWeek } = fitnessProfile
  const goals = fitnessProfile.fitnessGoals || (fitnessProfile.fitnessGoal ? [fitnessProfile.fitnessGoal] : [])

  if (!goals.length) return []

  const tips = []

  // Goal-based primary tips
  if (goals.includes('build_muscle')) {
    if (experienceLevel === 'beginner') {
      tips.push({
        title: 'Compound Movements First',
        tip: 'Focus on compound movements (squat, bench, deadlift) 3x per week to build a strong foundation.',
      })
      tips.push({
        title: 'Hypertrophy Rep Range',
        tip: 'Aim for 8–12 reps per set with progressive overload — add weight or reps each session.',
      })
    } else if (experienceLevel === 'intermediate') {
      tips.push({
        title: 'Progressive Overload',
        tip: 'Track your lifts and aim to beat your previous session — even one extra rep counts.',
      })
      tips.push({
        title: 'Volume is Key',
        tip: 'Target 10–20 sets per muscle group per week split across 4–5 training days.',
      })
    } else {
      tips.push({
        title: 'Periodization',
        tip: 'Cycle through hypertrophy (8–12 reps), strength (3–6 reps), and deload weeks every 4–6 weeks.',
      })
      tips.push({
        title: 'Mind-Muscle Connection',
        tip: 'Slow down your eccentric (lowering) phase to 3–4 seconds for greater muscle activation.',
      })
    }
  } else if (goals.includes('lose_weight')) {
    tips.push({
      title: 'Combine Training Modalities',
      tip: 'Mix weight training with 20–30 min cardio sessions to maximize calorie burn and preserve muscle.',
    })
    tips.push({
      title: 'Consistency Over Intensity',
      tip: 'Track your workouts consistently — frequency matters more than intensity when losing weight.',
    })
  } else if (goals.includes('increase_strength')) {
    tips.push({
      title: 'Train Heavy',
      tip: 'Train 4–5 days/week focusing on 3–6 rep ranges at 80–90% of your one-rep max.',
    })
    tips.push({
      title: 'Rest Fully Between Sets',
      tip: 'Rest 2–3 minutes between heavy sets to ensure full nervous system recovery for maximum output.',
    })
  } else if (goals.includes('improve_endurance')) {
    tips.push({
      title: 'Zone 2 Cardio',
      tip: 'Build your aerobic base with 30–60 min of Zone 2 cardio (conversational pace) 3–4x per week.',
    })
    tips.push({
      title: 'Progressive Overload for Cardio',
      tip: 'Gradually increase duration or distance by no more than 10% per week to avoid injury.',
    })
  } else if (goals.includes('general_fitness')) {
    tips.push({
      title: 'Well-Rounded Routine',
      tip: 'Aim for 2–3 strength sessions and 2 cardio sessions per week for balanced fitness.',
    })
    tips.push({
      title: 'Don\'t Skip Mobility',
      tip: 'Add 10–15 min of mobility or stretching after each session to improve range of motion and recovery.',
    })
  } else if (goals.includes('athletic_performance')) {
    tips.push({
      title: 'Sport-Specific Training',
      tip: 'Prioritize explosive movements (jumps, sprints, plyometrics) that transfer directly to your sport.',
    })
    tips.push({
      title: 'Recovery is Training',
      tip: 'Sleep 8–9 hours and schedule active recovery days — elite performance is built in rest, not just reps.',
    })
  }

  // Experience-based bonus tip
  if (experienceLevel === 'beginner' && tips.length < 3) {
    tips.push({
      title: 'Master Form First',
      tip: 'Focus on technique before adding weight. Proper form prevents injury and builds long-term progress.',
    })
  } else if (experienceLevel === 'advanced' && tips.length < 3) {
    tips.push({
      title: 'Track Everything',
      tip: 'Detailed workout logs are your secret weapon — small optimizations compound into big results over months.',
    })
  }

  // Workout-type specific bonus
  if (workoutTypes.includes('yoga') && tips.length < 3) {
    tips.push({
      title: 'Yoga Boosts Recovery',
      tip: 'Schedule yoga on your rest days to accelerate muscle recovery and reduce soreness.',
    })
  } else if (workoutTypes.includes('hiit') && tips.length < 3) {
    tips.push({
      title: 'HIIT Frequency',
      tip: 'Limit HIIT to 2–3 sessions per week — it\'s high-demand on your CNS and needs adequate recovery.',
    })
  }

  // Days per week nudge
  if (daysPerWeek && daysPerWeek < 3 && tips.length < 3) {
    tips.push({
      title: 'Build the Habit',
      tip: `Training ${daysPerWeek}x/week is a great start. As it becomes routine, consider adding one more day for faster progress.`,
    })
  }

  return tips.slice(0, 3)
}
