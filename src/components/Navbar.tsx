import { Navbar as NextUINavbar, NavbarBrand, NavbarContent, Button } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { SunIcon, MoonIcon } from "./Icons"

export default function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme === 'dark'
      }
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <NextUINavbar>
      <NavbarBrand>
        <p className="font-bold text-inherit">Question Converter</p>
      </NavbarBrand>
      <NavbarContent justify="end">
        <Button
          isIconOnly
          variant="light"
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </NavbarContent>
    </NextUINavbar>
  )
}
