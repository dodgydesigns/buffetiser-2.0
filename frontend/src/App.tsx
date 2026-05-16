import { useEffect, useState } from 'react'
import { fetchHealth } from './api'

function App() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetchHealth().then((value) => setStatus(value.status)).catch(() => setStatus('error'))
  }, [])

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 900, padding: 24 }}>
        <div style={{ position: 'relative', display: 'inline-block', width: '100%', marginBottom: 20 }}>
          <img src="/media/welcome.svg" alt="Welcome" style={{ width: '100%', height: 'auto', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderRadius: 8, display: 'block' }} />
          <img src="/media/warren-buffett.jpg" alt="Warren Buffett" style={{ position: 'absolute', left: 100, top: '45%', transform: 'translateY(-50%)', width: '25%', height: 'auto', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderRadius: 8 }} />
        </div>
        <p>Backend health: <strong>{status}</strong></p>
      </div>
    </main>
  )
}

export default App
