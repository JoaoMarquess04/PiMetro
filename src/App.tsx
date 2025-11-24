// import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './paginas/dashboard.tsx'
import Casos from './paginas/casos.tsx'
import Configuracoes from './paginas/configuracoes.tsx'
import Login from './paginas/login.tsx'
import RequireAuth from './components/RequireAuth'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/casos" element={<RequireAuth><Casos /></RequireAuth>} />
        <Route path="/configuracoes" element={<RequireAuth><Configuracoes /></RequireAuth>} />
        <Route path='/' element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
