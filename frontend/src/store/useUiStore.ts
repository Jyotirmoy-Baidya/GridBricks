import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

/** The class is set by an inline script in index.html before first paint, so read it back. */
const initialTheme = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'

interface UiState {
  sidebarCollapsed: boolean
  theme: Theme
  toggleSidebar: () => void
  toggleTheme: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  theme: initialTheme(),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', theme === 'dark')
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // storage can be blocked; the choice then lasts for this visit only
      }
      return { theme }
    }),
}))
