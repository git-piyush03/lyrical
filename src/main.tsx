import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initDynamicTheme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
)

function Boot() {
  useEffect(() => {
    initDynamicTheme('/bg.jpg')
  }, [])
  return <App />
}
