import React from 'react'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from 'sonner'
import { ModelProvider } from '../context/ModelContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <ModelProvider>
          {children}
          <Toaster position="top-center" expand={false} richColors />
        </ModelProvider>
      </NextThemesProvider>
    </NextUIProvider>
  )
}
