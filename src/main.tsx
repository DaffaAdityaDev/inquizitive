import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NextUIProvider } from "@nextui-org/react"
import './index.css'
import App from './App.tsx'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextUIProvider>
      <Toaster />
      <App />
    </NextUIProvider>
  </StrictMode>,
)
