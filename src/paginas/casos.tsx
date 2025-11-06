import Envio from "../Envio"
import Navbar from "../components/NavBar"
import Separador from "../components/ui/separador"
import CardCasos from "../components/CardCasos"
import tituloPag from "../metodos/tituloPag"

function Casos() {
  tituloPag('Casos')
  return (
    <div className='flex overflow-hidden'>
      <Navbar />
      <div className="h-screen w-screen overflow-y-auto px-7">
        <Separador titulo='Todos os casos' />
        <CardCasos/>
      </div>
    </div>
  )
}

export default Casos