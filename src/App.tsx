// import './App.css'
import { HashRouter as Router, Routes, Route} from 'react-router-dom'
import Dashboard from './paginas/dashboard.tsx'
import Casos from './paginas/casos.tsx'
import Configuracoes from './paginas/configuracoes.tsx'
import Login from './paginas/login.tsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/casos" element={<Casos />} />
        <Route path='/configuracoes' element={<Configuracoes />} />
        <Route path='/' element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
