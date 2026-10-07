import React from 'react'
import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { Toaster } from 'sonner'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
    />
  )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
        <ThemedToaster />
      </NextThemesProvider>
    </NextUIProvider>
  )
}
