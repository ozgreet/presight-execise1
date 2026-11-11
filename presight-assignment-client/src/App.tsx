import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PeoplePage } from './components/directory/PeoplePage'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { WorkspaceShell } from './components/workspace/WorkspaceShell'
import './styles/directory.css'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<WorkspaceShell />}>
            <Route index element={<PeoplePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
