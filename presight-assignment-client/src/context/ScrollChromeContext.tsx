import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ScrollChromeContextValue = {
  headerCollapsed: boolean
  setHeaderCollapsed: (collapsed: boolean) => void
}

const ScrollChromeContext = createContext<ScrollChromeContextValue | null>(null)

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const value = useMemo(
    () => ({ headerCollapsed, setHeaderCollapsed }),
    [headerCollapsed],
  )

  return (
    <ScrollChromeContext.Provider value={value}>
      {children}
    </ScrollChromeContext.Provider>
  )
}

export function useScrollChrome() {
  const context = useContext(ScrollChromeContext)
  if (!context) {
    throw new Error('useScrollChrome must be used within ScrollChromeProvider')
  }
  return context
}
