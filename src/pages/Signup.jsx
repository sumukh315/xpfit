import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PixelCharacter from '../components/PixelCharacter'
import { CLASSES, CLASS_INFO } from '../lib/pixelCharacter'

const STEPS = ['Account', 'Fitness Goals', 'Hero']

const FITNESS_GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'increase_strength', label: 'Increase Strength' },
  { value: 'improve_endurance', label: 'Improve Endurance' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'athletic_performance', label: 'Athletic Performance' },
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'New to this',   desc: 'Learning form & basics' },
  { value: 'intermediate', label: 'Some experience', desc: 'Know the movements' },
  { value: 'advanced',     label: 'Been at it',    desc: 'Training consistently' },
]

const WORKOUT_TYPES = [
  { value: 'weightlifting', label: 'Weightlifting' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'sports', label: 'Sports' },
  { value: 'crossfit', label: 'CrossFit' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [character, setCharacter] = useState({
    gender: 'male',
    charClass: 'warrior',
  })

  const [fitnessProfile, setFitnessProfile] = useState({
    fitnessGoals: [],
    experienceLevel: '',
    workoutTypes: [],
    daysPerWeek: 3,
  })

  function updateChar(key, value) {
    setCharacter(prev => ({ ...prev, [key]: value }))
  }

  function updateFitness(key, value) {
    setFitnessProfile(prev => ({ ...prev, [key]: value }))
  }

  function toggleWorkoutType(type) {
    setFitnessProfile(prev => {
      const types = prev.workoutTypes.includes(type)
        ? prev.workoutTypes.filter(t => t !== type)
        : [...prev.workoutTypes, type]
      return { ...prev, workoutTypes: types }
    })
  }

  function toggleFitnessGoal(goal) {
    setFitnessProfile(prev => {
      const goals = prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
      return { ...prev, fitnessGoals: goals }
    })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      await signup(email, password, username, character, fitnessProfile)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="pixel-card p-8 w-full max-w-2xl">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center border-2 pixel-font ${
                i <= step ? 'border-sky-400 bg-sky-900/40 text-sky-300' : 'border-gray-600 text-gray-600'
              }`} style={{ fontSize: '10px' }}>
                {i + 1}
              </div>
              <span className={`pixel-font hidden sm:block ${i <= step ? 'text-sky-300' : 'text-gray-600'}`} style={{ fontSize: '8px' }}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-purple-500' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Account */}
        {step === 0 && (
          <div>
            <h2 className="fantasy-font text-sky-400 mb-6 text-center" style={{ fontSize: '20px' }}>
              Create Account
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>USERNAME</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
                  placeholder="YourHeroName" />
              </div>
              <div>
                <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none" />
              </div>
              <div>
                <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>PASSWORD</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none" />
              </div>
              {error && <p className="text-red-400" style={{ fontSize: '12px' }}>{error}</p>}
              <button onClick={() => { if (email && password && username) setStep(1) }}
                className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 mt-2">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Fitness Goals */}
        {step === 1 && (
          <div>
            <h2 className="fantasy-font text-sky-400 mb-2 text-center" style={{ fontSize: '20px' }}>
              Fitness Goals
            </h2>
            <p className="text-gray-500 text-center mb-6" style={{ fontSize: '11px' }}>
              Help us personalize your XPFit experience
            </p>

            {/* Fitness Goals */}
            <div className="mb-5">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>PRIMARY GOALS (select all that apply)</label>
              <div className="grid grid-cols-2 gap-2">
                {FITNESS_GOALS.map(g => (
                  <button key={g.value} onClick={() => toggleFitnessGoal(g.value)}
                    className={`py-2 px-3 border-2 text-left transition-all ${
                      fitnessProfile.fitnessGoals.includes(g.value)
                        ? 'border-sky-400 bg-sky-900/40 text-sky-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 bg-black/20'
                    }`} style={{ fontSize: '11px' }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="mb-5">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>EXPERIENCE LEVEL</label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button key={lvl.value} onClick={() => updateFitness('experienceLevel', lvl.value)}
                    className={`flex-1 py-2 px-2 border-2 transition-all text-center ${
                      fitnessProfile.experienceLevel === lvl.value
                        ? 'border-sky-400 bg-sky-900/40 text-sky-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 bg-black/20'
                    }`}>
                    <div className="pixel-font" style={{ fontSize: '8px' }}>{lvl.label}</div>
                    <div className="text-gray-500" style={{ fontSize: '9px' }}>{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Workout Types */}
            <div className="mb-5">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>WORKOUT TYPES (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map(type => (
                  <button key={type.value} onClick={() => toggleWorkoutType(type.value)}
                    className={`py-1.5 px-3 border-2 transition-all ${
                      fitnessProfile.workoutTypes.includes(type.value)
                        ? 'border-sky-400 bg-sky-900/40 text-sky-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 bg-black/20'
                    }`} style={{ fontSize: '11px' }}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Per Week */}
            <div className="mb-6">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>
                DAYS PER WEEK: <span className="text-sky-400">{fitnessProfile.daysPerWeek}</span>
              </label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7].map(d => (
                  <button key={d} onClick={() => updateFitness('daysPerWeek', d)}
                    className={`flex-1 py-2 border-2 pixel-font transition-all ${
                      fitnessProfile.daysPerWeek === d
                        ? 'border-sky-400 bg-sky-900/40 text-sky-300'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`} style={{ fontSize: '10px' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="pixel-btn bg-gray-800 border-gray-600 text-gray-300 py-2 px-4" style={{ fontSize: '9px' }}>← Back</button>
              <button onClick={() => setStep(2)}
                className="flex-1 pixel-btn bg-sky-700 border-sky-500 text-white py-2" style={{ fontSize: '9px' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Hero selection */}
        {step === 2 && (
          <div>
            <h2 className="fantasy-font text-sky-400 mb-6 text-center" style={{ fontSize: '20px' }}>
              Choose Your Hero
            </h2>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="pixel-card p-4 glow-purple flex flex-col items-center gap-2">
                <PixelCharacter options={character} scale={1} />
                <span className="pixel-font text-sky-300" style={{ fontSize: '9px' }}>
                  {CLASS_INFO[character.charClass]?.label} · {character.gender === 'male' ? 'Male' : 'Female'}
                </span>
              </div>
            </div>

            {/* Gender */}
            <div className="mb-5">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>GENDER</label>
              <div className="flex gap-3">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => updateChar('gender', g)}
                    className={`flex-1 py-2 capitalize border-2 pixel-font transition-all ${
                      character.gender === g
                        ? 'border-sky-400 bg-sky-900/40 text-sky-300'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400'
                    }`} style={{ fontSize: '9px' }}>
                    {g === 'male' ? '⚔ Male' : '✦ Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Class grid */}
            <div className="mb-6">
              <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>CLASS</label>
              <div className="grid grid-cols-3 gap-2">
                {CLASSES.map(cls => {
                  const info = CLASS_INFO[cls]
                  const selected = character.charClass === cls
                  return (
                    <button key={cls} onClick={() => updateChar('charClass', cls)}
                      className={`py-3 px-2 border-2 transition-all flex flex-col items-center gap-2 ${
                        selected
                          ? 'border-sky-400 bg-sky-900/40'
                          : 'border-gray-700 hover:border-gray-500 bg-black/20'
                      }`}>
                      <PixelCharacter options={{ gender: character.gender, charClass: cls }} scale={0.5} />
                      <div className={`pixel-font ${selected ? 'text-sky-300' : 'text-gray-300'}`} style={{ fontSize: '8px' }}>
                        {info.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p className="text-red-400 mb-2" style={{ fontSize: '12px' }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="pixel-btn bg-gray-800 border-gray-600 text-gray-300 py-2 px-4">← Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 pixel-btn bg-green-700 border-green-500 text-white py-2 disabled:opacity-50">
                {loading ? 'Creating...' : '🎮 Start Quest!'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-500 mt-6" style={{ fontSize: '12px' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">Login</Link>
        </p>
      </div>
    </div>
  )
}
