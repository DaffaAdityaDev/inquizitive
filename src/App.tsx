import QuestionConverter from './components/QuestionConverter'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Question Converter
          </h1>
        </div>
      </header>
      <main>
        <QuestionConverter />
      </main>
    </div>
  )
}

export default App
