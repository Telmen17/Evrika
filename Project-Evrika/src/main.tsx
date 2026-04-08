import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalAudioProvider } from './context/GlobalAudioContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalAudioProvider>
      <App />
    </GlobalAudioProvider>
  </StrictMode>,
)
