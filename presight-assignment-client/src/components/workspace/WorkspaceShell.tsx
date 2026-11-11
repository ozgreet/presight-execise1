import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ScrollChromeProvider, useScrollChrome } from '../../context/ScrollChromeContext'
import { useAmbientGlow } from '../../hooks/useAmbientGlow'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import {
  DirectoryHeaderBrand,
  HeaderPeopleAmbient,
} from './DirectoryHeaderBrand'
import { ThemeToggle } from './ThemeToggle'

function WorkspaceShellContent() {
  const breakpoint = useBreakpoint()
  const canvasRef = useAmbientGlow<HTMLDivElement>()
  const { headerCollapsed } = useScrollChrome()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  const appClassName = headerCollapsed ? 'app header-collapsed' : 'app'

  return (
    <div className="canvas" ref={canvasRef} data-theme={theme}>
      <div className={appClassName} data-breakpoint={breakpoint}>
        <header className="app-header">
          <HeaderPeopleAmbient />
          <div className="app-header-start">
            <DirectoryHeaderBrand />
          </div>
          <h1 className="brand-title">User Directory</h1>
          <div className="app-header-actions">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function WorkspaceShell() {
  return (
    <ScrollChromeProvider>
      <WorkspaceShellContent />
    </ScrollChromeProvider>
  )
}
