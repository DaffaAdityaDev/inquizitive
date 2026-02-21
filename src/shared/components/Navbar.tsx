import { Navbar as NextUINavbar, NavbarBrand, NavbarContent, Button, Select, SelectItem } from "@nextui-org/react"
import { SunIcon, MoonIcon } from "./Icons"
import { useTheme } from "next-themes"
import { useModelContext } from "../../context/ModelContext"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { selectedModel, setSelectedModel, models } = useModelContext()

  return (
    <NextUINavbar maxWidth="xl" position="sticky" isBordered className="bg-background/70 shadow-sm">
      <NavbarBrand>
        <p className="font-bold text-inherit">INQUIZITIVE</p>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <Select 
          label="AI Model" 
          size="sm" 
          variant="faded"
          className="w-48"
          classNames={{
            trigger: "bg-default-100 hover:bg-default-200 transition-colors border-none shadow-sm",
          }}
          selectedKeys={[selectedModel]}
          onSelectionChange={(keys) => setSelectedModel(Array.from(keys)[0] as string)}
        >
          {models.map((model: string) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </Select>
      </NavbarContent>
      <NavbarContent justify="end">
        <Button
          isIconOnly
          variant="flat"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </Button>
      </NavbarContent>
    </NextUINavbar>
  )
}
