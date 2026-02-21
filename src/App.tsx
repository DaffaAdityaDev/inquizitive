import { AppProviders } from './app/providers'
import { AppRoutes } from './app/routes'
import './App.css'

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}

export default App
