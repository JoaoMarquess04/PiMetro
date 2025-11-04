// import './App.css'
import Envio from './Envio'
import Card from './components/Card.tsx'
import NavBar from './components/NavBar.tsx'
import '@fortawesome/fontawesome-free/css/all.min.css'

function App() {

  return (
    <div className='flex'>
      <NavBar />
      <div className='flex'>
        <Card texto='Obras' icone='hammer' footer='Casos registrados' />
        <Card texto='Este mês' icone='chart-line' footer='Novos casos' />
        <Card texto='Últimas 24h' icone='clock' footer='Casos recentes' />
      </div>
    </div>
  )
}

export default App
