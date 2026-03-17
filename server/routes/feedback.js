import { Router } from 'express'
import nodemailer from 'nodemailer'

const router = Router()

router.post('/', async (req, res) => {
  const { email, message } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' })

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'sumukh315@gmail.com',
      subject: `XPFit Feedback${email ? ` from ${email}` : ''}`,
      text: `From: ${email || 'Anonymous'}\n\n${message}`,
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('Feedback email error:', e)
    res.status(500).json({ error: 'Failed to send feedback' })
  }
})

export default router
