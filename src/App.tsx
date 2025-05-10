import QuestionConverter from './components/QuestionConverter'
import Navbar from './components/Navbar'
import { ModelProvider } from './context/ModelContext'

import './App.css'

function App() {
  return (
    <ModelProvider>
      <div className="min-h-screen">
        <Navbar />
        <main className=" mt-5">
          <QuestionConverter />
        </main>
      </div>
    </ModelProvider>
  )
}

export default App
