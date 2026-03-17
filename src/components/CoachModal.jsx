import { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api'

export default function CoachModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'coach', text: "Hey! I'm your gym coach 💪 Ask me anything — how to use a machine, form tips, or snap a photo and I'll take a look!" }
  ])
  const [input, setInput] = useState('')
  const [image, setImage] = useState(null) // { base64, mimeType, preview }
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setImage({ base64, mimeType: file.type, preview: reader.result })
    }
    reader.readAsDataURL(file)
  }

  async function send() {
    const text = input.trim()
    if (!text && !image) return
    const userMsg = { role: 'user', text, imagePreview: image?.preview }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setImage(null)
    setLoading(true)
    try {
      const { reply } = await api.askCoach({
        message: text,
        imageBase64: image?.base64 || null,
        imageMimeType: image?.mimeType || null,
      })
      setMessages(prev => [...prev, { role: 'coach', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'coach', text: 'Sorry, I ran into an error. Try again!' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pixel-card w-full max-w-lg mx-2 mb-20 md:mb-0 flex flex-col"
        style={{ height: '70vh', maxHeight: '600px' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sky-900/40">
          <div>
            <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Gym Coach</h2>
            <p className="text-gray-500" style={{ fontSize: '11px' }}>Ask about form, machines, or send a photo</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-sky-800 text-white' : 'glass-row text-gray-200'}`}
                style={{ fontSize: '13px', lineHeight: '1.5' }}>
                {msg.imagePreview && (
                  <img src={msg.imagePreview} alt="uploaded" className="rounded-lg mb-2 max-w-full" style={{ maxHeight: '150px', objectFit: 'cover' }} />
                )}
                {msg.text && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-row px-4 py-2 rounded-xl text-gray-400" style={{ fontSize: '13px' }}>
                thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Image preview */}
        {image && (
          <div className="px-4 pb-1 flex items-center gap-2">
            <img src={image.preview} alt="preview" className="rounded-lg" style={{ height: '48px', width: '48px', objectFit: 'cover' }} />
            <button onClick={() => setImage(null)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">Remove</button>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-sky-900/40 flex gap-2 items-end">
          <button onClick={() => fileRef.current?.click()}
            className="glass-option text-gray-400 hover:text-sky-400 transition-colors px-2 py-2 rounded-lg flex-shrink-0"
            title="Attach photo">
            <span style={{ fontSize: '16px' }}>📷</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about form, machines..."
            rows={1}
            className="glass-input flex-1 resize-none"
            style={{ fontSize: '13px', minHeight: '38px', maxHeight: '100px' }}
          />
          <button
            onClick={send}
            disabled={loading || (!input.trim() && !image)}
            className="pixel-btn bg-sky-800 border-sky-600 text-white px-3 py-2 disabled:opacity-40 flex-shrink-0"
            style={{ fontSize: '13px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
