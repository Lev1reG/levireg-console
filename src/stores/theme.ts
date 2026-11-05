import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

type ThemeState = { theme: Theme; toggle: () => void }

const apply = (theme: Theme) =>
  document.documentElement.classList.toggle('dark', theme === 'dark')

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
      toggle: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark'
        apply(theme)
        set({ theme })
      },
    }),
    { name: 'theme', onRehydrateStorage: () => (s) => s && apply(s.theme) },
  ),
)
