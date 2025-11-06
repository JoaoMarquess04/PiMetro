// import './App.css'
import { HashRouter as Router, Routes, Route} from 'react-router-dom'
import Dashboard from './paginas/dashboard.tsx'
import Casos from './paginas/casos.tsx'
import Configuracoes from './paginas/configuracoes.tsx'
import tituloPag from './metodos/tituloPag'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/casos" element={<Casos />} />
        <Route path='/configuracoes' element={<Configuracoes />} />
      </Routes>
    </Router>
  )
}

export default App
