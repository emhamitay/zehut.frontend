import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './style/index.css'
import "./style/shadcn.css"

document.documentElement.lang = 'he'
document.documentElement.dir = 'rtl'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
