import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import ReflexGame from './games/reflex/ReflexGame'
import GlobalButtonSound from './components/GlobalButtonSound'

function App() {
  return (
    <BrowserRouter>
      <GlobalButtonSound />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reflex" element={<ReflexGame />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

