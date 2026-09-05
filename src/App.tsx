import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'

import ReflexGame from './games/reflex/ReflexGame'
import StackGame from './games/stack/StackGame'
import DodgeGame from './games/dodge/DodgeGame'
import FlappyGame from './games/flappy/FlappyGame'
import Game2048 from './games/2048/Game2048'
import Snake from './games/snake/Snake'
import GlobalButtonSound from './components/GlobalButtonSound'
import Tetris from './games/tetris/Tetris'

function App() {
  return (
    <BrowserRouter>
      <GlobalButtonSound />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/reflex"
          element={<ReflexGame />}
        />

        <Route
          path="/stack"
          element={<StackGame />}
        />

        <Route
          path="/dodge"
          element={<DodgeGame />}
        />

        <Route
          path="/flappy"
          element={<FlappyGame />}
        />

        <Route
          path="/2048"
          element={<Game2048 />}
        />

        <Route
          path="/snake"
          element={<Snake />}
        />
        
        <Route path="/tetris" element={<Tetris />} />
        
      </Routes>

    </BrowserRouter>
  )
}

export default App