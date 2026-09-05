import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ReflexGame from './games/reflex/ReflexGame'
import StackGame from './games/stack/StackGame'
import DodgeGame from './games/dodge/DodgeGame'
import FlappyGame from './games/flappy/FlappyGame'
import GlobalButtonSound from './components/GlobalButtonSound'

function App() {
  return (
    <BrowserRouter>
      <GlobalButtonSound />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reflex" element={<ReflexGame />} />
        <Route path="/stack" element={<StackGame />} />
        <Route path="/dodge" element={<DodgeGame />} />
        <Route path="/flappy" element={<FlappyGame />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App