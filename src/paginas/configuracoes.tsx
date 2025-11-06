import Navbar from "../components/NavBar"
import Separador from "../components/ui/separador"
import tituloPag from "../metodos/tituloPag"

function Configurações() {
  tituloPag('Configurações')
  return (
    <div className='flex overflow-hidden'>
      <Navbar />
      <div className='h-screen w-screen overflow-y-auto px-7'>
        <Separador titulo='Configurações' />
      </div>
    </div>
  )
}

export default Configurações