import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './cursors.css'
import { installQuillCursors } from './lib/installQuillCursors'
import App from './App.tsx'
import { GlobalAudioProvider } from './context/GlobalAudioContext'

installQuillCursors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalAudioProvider>
      <App />
    </GlobalAudioProvider>
  </StrictMode>,
)
