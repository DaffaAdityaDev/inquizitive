import { Navbar as NextUINavbar, NavbarBrand, NavbarContent, Button, Select, SelectItem } from "@nextui-org/react"
import { useEffect, useState } from "react"
import { SunIcon, MoonIcon } from "./Icons"
import { useModelContext } from "../context/ModelContext"

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

  const { models, selectedModel, setSelectedModel, loadingModels } = useModelContext()

  return (
    <NextUINavbar>
      <NavbarBrand>
        <p className="font-bold text-inherit">Question Converter</p>
      </NavbarBrand>
      <NavbarContent justify="center">
        {models.length > 0 && (
          <Select
            label="Select Model"
            placeholder="Choose a model"
            selectedKeys={selectedModel ? [selectedModel] : []}
            isLoading={loadingModels}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="max-w-xs"
            size="sm"
          >
            {models.map((modelName: string) => (
              <SelectItem key={modelName} value={modelName}>
                {modelName}
              </SelectItem>
            ))}
          </Select>
        )}
      </NavbarContent>
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
