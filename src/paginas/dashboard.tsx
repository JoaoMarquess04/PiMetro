import { useEffect, useMemo, useState } from 'react';
import Container from '../components/ui/container.tsx';
import Separador from '../components/ui/separador.tsx';
import Caso from '../components/Caso.tsx';
import Card from '../components/Card.tsx';
import NavBar from '../components/NavBar.tsx';
import Contador from '../components/ui/contador.tsx';
import tituloPag from '../metodos/tituloPag';
import '@fortawesome/fontawesome-free/css/all.min.css'

type Case = {
  id: number;
  caso: string;
  descricao: string;
  progress_pct: number;
  img_path: string | null;
  ifc_path: string | null;
  data: string;
  uploaded_at_iso: string;
};

const API = 'http://localhost:8000';

function Dashboard() {
  tituloPag('Dashboard');

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/casos`);
        const data = await res.json();
        setCases(data.cases || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = new Date();

  const casesLast10h = useMemo(() => {
    const cutoff = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    return (cases || []).filter(c => new Date(c.uploaded_at_iso) >= cutoff);
  }, [cases]);

  const countLast24h = useMemo(() => {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return (cases || []).filter(c => new Date(c.uploaded_at_iso) >= cutoff).length;
  }, [cases]);

  const countThisMonth = useMemo(() => {
    return (cases || []).filter(c => {
      const d = new Date(c.uploaded_at_iso);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [cases]);

  const totalObras = cases.length;

  return (
    <div className='flex overflow-hidden'>
      <NavBar/>
      <div className='h-screen w-screen overflow-y-auto px-7'>
        <Separador titulo='Dashboard' />

        <div className='flex h-fit justify-center space-x-6'>
          <Card texto='Obras' icone='hammer' footer='Obras registradas' contador={totalObras} />
          <Card texto='Este mês' icone='chart-line' footer='Novas obras'     contador={countThisMonth} />
          <Card texto='Últimas 24h' icone='clock' footer='Obras recentes'  contador={countLast24h} />
        </div>

        <Separador />

        <Container titulo='Obras Recentes' subtitulo='Últimas 10 horas'>
          <Contador>
            <div className='space-y-4'>
              {loading && <p>Carregando...</p>}
              {!loading && casesLast10h.length === 0 && <p>Nenhum caso nas últimas 10 horas.</p>}
              {!loading && casesLast10h.map(c => (
                <Caso
                  key={c.id}
                  titulo={c.caso}
                  descricao={c.descricao}
                  progress={c.progress_pct}
                  img={c.img_path || undefined}
                  dataLabel={new Date(c.uploaded_at_iso)}
                />
              ))}
            </div>
          </Contador>
        </Container>

        <Separador linha={false} />
      </div>
    </div>
  );
}

export default Dashboard;
