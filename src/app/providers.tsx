import React from 'react'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from 'sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
        <Toaster position="top-center" expand={false} richColors />
      </NextThemesProvider>
    </NextUIProvider>
  )
}
