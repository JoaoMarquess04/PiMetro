import { useCallback, useEffect, useState } from "react"
import Navbar from "../components/NavBar"
import Separador from "../components/ui/separador"
import CardCasos from "../components/CardCasos"
import tituloPag from "../metodos/tituloPag"

type Case = {
  id: number;
  caso: string;
  descricao: string;
  progress_pct: number;
  img_path: string | null;
  ifc_path: string | null;
  data: string;
}

const API = 'http://localhost:8000';

function Casos() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/casos`)
      .then(res => res.json())
      .then(data => {
        setCases(data.cases || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar casos:', err);
        setError('Erro ao carregar os casos. Por favor, tente novamente.');
        setLoading(false);
      });
  }, [])

  useEffect(() => { load(); }, [load]);

  tituloPag('Casos')

  return (
    <div className='flex overflow-hidden'>
      <Navbar />
      <div className="h-screen w-screen overflow-y-auto px-7">
        <Separador titulo='Todos os casos' />
        {loading ? (
          <div className="flex justify-center items-center pt-10">
            <i className="fa-solid fa-spinner animate-spin text-2xl text-blue-600"></i>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center pt-10">{error}</div>
        ) : (
          <div className="flex flex-wrap gap-6">
            <CardCasos add={true} onChanged={load} />
            {cases.map(caseData => (
              <CardCasos key={caseData.id} case={caseData} onChanged={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Casos
