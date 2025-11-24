import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import Separador from "../components/ui/separador";
import tituloPag from "../metodos/tituloPag";
import { auth } from "../../firebaseconfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

function Configurações() {
  tituloPag("Configurações");
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (err) {
      // opcional: mostrar erro ao usuário
      console.error("Erro ao deslogar:", err);
    }
  }

  return (
    <div className="flex overflow-hidden">
      <Navbar />
      <div className="h-screen w-screen overflow-y-auto px-7 py-6">
        <Separador titulo="Configurações" />

        <div className="mt-6">
          <h3 className="text-lg font-semibold">Informações do usuário</h3>

          <div className="mt-3 text-sm text-slate-600">E-mail</div>
          <div className="text-base mb-2">{user?.email || "—"}</div>

          <div className="text-sm text-slate-600">UID</div>
          <div className="text-base mb-4">{user?.uid || "—"}</div>

          <div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-70"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Configurações;