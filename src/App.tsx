import QuestionConverter from './components/QuestionConverter'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className=" mt-5">
        <QuestionConverter />
      </main>
    </div>
  )
}

export default App
