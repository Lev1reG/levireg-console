import { Moon, Sun } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useThemeStore } from '#/stores/theme'

export function ThemeToggle() {
  const isDark = useThemeStore((s) => s.theme === 'dark')
  const toggle = useThemeStore((s) => s.toggle)
  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-auto"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      onClick={toggle}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
