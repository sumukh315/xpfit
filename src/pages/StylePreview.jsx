// Style preview — visit /style-preview to see all character classes
import PixelCharacter from '../components/PixelCharacter'
import { CLASSES, CLASS_INFO } from '../lib/pixelCharacter'

export default function StylePreview() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12" style={{ background: '#0a0a14' }}>
      <h1 className="pixel-font text-purple-400 mb-2 text-center" style={{ fontSize: '16px' }}>
        Character Classes
      </h1>
      <p className="text-gray-500 mb-10 text-sm">Choose your path</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl w-full">
        {CLASSES.map(cls => (
          <div key={cls} className="pixel-card p-4" style={{ background: '#1a1a2e', border: '2px solid #3a2a5a' }}>
            <p className="pixel-font text-purple-400 text-center mb-4" style={{ fontSize: '9px' }}>
              {CLASS_INFO[cls].label}
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <PixelCharacter options={{ gender: 'male', charClass: cls }} scale={0.6} />
                <span className="text-gray-500 text-xs">M</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PixelCharacter options={{ gender: 'female', charClass: cls }} scale={0.6} />
                <span className="text-gray-500 text-xs">F</span>
              </div>
            </div>
            <p className="text-gray-500 text-center mt-3" style={{ fontSize: '11px' }}>{CLASS_INFO[cls].desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
