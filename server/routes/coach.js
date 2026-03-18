import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const SYSTEM_PROMPT = `You are an encouraging fitness coach inside the XPFit workout app. Your job is to help gym-goers — especially beginners — with:
- How to use gym machines and equipment
- Proper exercise form and posture tips
- What muscles an exercise targets
- Workout programming and rest advice
- General nutrition basics

Keep answers concise, friendly, and practical. Use simple language — assume the user is new to the gym. If someone sends a photo, describe what you see and give specific form or equipment tips. If asked anything completely unrelated to fitness or health, politely redirect: "I'm your gym coach — ask me anything about workouts, form, or equipment!"`

router.post('/', requireAuth, async (req, res) => {
  const { message, imageBase64, imageMimeType } = req.body
  if (!message?.trim() && !imageBase64) return res.status(400).json({ error: 'Message or image required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'AI coach not configured' })

  const parts = []
  if (message?.trim()) parts.push({ text: message })
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: imageMimeType || 'image/jpeg', data: imageBase64 } })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Understood. I am your personal trainer.' }] },
            { role: 'user', parts },
          ],
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(502).json({ error: `Gemini: ${data?.error?.message || data?.error?.status || JSON.stringify(data)}` })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.'
    res.json({ reply: text })
  } catch (e) {
    console.error('Coach error:', e)
    res.status(500).json({ error: 'Failed to reach AI coach' })
  }
})

export default router
