import { Navbar as NextUINavbar, NavbarBrand, NavbarContent, Button } from "@nextui-org/react"
import { SunIcon, MoonIcon } from "./Icons"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { tactileTap } from "../animations/animeUtils"

export function Navbar() {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    tactileTap(e.currentTarget)
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleBrandClick = (e: React.MouseEvent<HTMLDivElement>) => {
    tactileTap(e.currentTarget)
    window.location.href = '/'
  }

  return (
    <NextUINavbar maxWidth="xl" position="sticky" isBordered className="bg-background/70 backdrop-blur-md shadow-sm">
      <NavbarBrand 
        className="gap-2 cursor-pointer select-none" 
        onClick={handleBrandClick}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-lg shadow-md shadow-primary/20 transition-transform hover:scale-105">
          Q
        </div>
        <p className="font-bold tracking-wider text-inherit text-lg">INQUIZITIVE</p>
      </NavbarBrand>
      <NavbarContent justify="end">
        <Button
          isIconOnly
          variant="flat"
          aria-label="Toggle theme"
          onClick={handleThemeToggle}
          className="rounded-xl overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5 text-warning-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </motion.div>
          </AnimatePresence>
        </Button>
      </NavbarContent>
    </NextUINavbar>
  )
}
