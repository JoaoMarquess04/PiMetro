import Envio from '../Envio'
import Container from '../components/ui/container.tsx'
import Separador from '../components/ui/separador.tsx'
import Caso from '../components/Caso.tsx'
import Card from '../components/Card.tsx'
import NavBar from '../components/NavBar.tsx'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { Children } from 'react';
import Contador from '../components/ui/contador.tsx';
import tituloPag from '../metodos/tituloPag';

function Dashboard() {
  tituloPag('Dashboard')
  const contadorChildren = [
    <Caso titulo='caso1' descricao='caso' key='caso1' />,
    <Caso titulo='caso1' descricao='caso' key='caso1' />,
    <Caso titulo='caso1' descricao='caso' key='caso1' />,
    <Caso titulo='caso1' descricao='caso' key='caso1' />,
    <Caso titulo='caso1' descricao='caso' key='caso1' />,
  ];
  const contadorObras = Children.count(contadorChildren);

  return (
    <div className='flex overflow-hidden'>
      <NavBar/>
      <div className='h-screen w-screen overflow-y-auto px-7'>
        <Separador titulo='Dashboard' />
        <div className='flex h-fit justify-center space-x-6'>
          <Card texto='Obras' icone='hammer' footer='Obras registradas' contador={contadorObras} />
          <Card texto='Este mês' icone='chart-line' footer='Novas obras' />
          <Card texto='Últimas 24h' icone='clock' footer='Obras recentes' />
        </div>
        <Separador />
        <Container titulo='Obras Recentes' subtitulo='Últimas obras adicionadas ao sistema'>
          <Contador>
            <div className='space-y-4'>
              {contadorChildren}
            </div>
          </Contador>
        </Container>
        <Separador linha={false}></Separador>
      </div>
    </div>
  )
}

export default Dashboard