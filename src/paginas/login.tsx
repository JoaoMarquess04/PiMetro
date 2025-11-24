import React, { useMemo, useState } from "react";

// Login de teste (hardcoded)
const TEST_EMAIL = "demo@amo.com";
const TEST_PASSWORD = "SenhaSeguraConfia";

// Validador simples de e-mail
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = useMemo(() => {
    if (!email || !isEmail(email)) return false;
    if (!password || password.length < 6) return false;
    return true;
  }, [email, password]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;

    setError(null);
    setLoading(true);

    // Checagem simples contra o login de teste
    const ok =
      email.trim().toLowerCase() === TEST_EMAIL.toLowerCase() &&
      password === TEST_PASSWORD;

    if (ok) {
      // redireciona para a página de dashboard
      window.location.href = "/#/dashboard";
    } else {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    }
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* blobs de fundo */}
      <div className="absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(closest-side,black,transparent)]">
        <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-400 blur-3xl" />
      </div>

      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Login</h1>
      </header>

      <main className="mx-auto grid max-w-lg place-items-center px-4 pb-24 pt-6">
        <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-bold leading-tight">Entrar</h2>
            <p className="mt-1 text-sm text-slate-600">
              Acesse com seu e-mail e senha.
            </p>

          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="voce@exemplo.com"
                required
              />
              {!email || isEmail(email) ? null : (
                <p className="mt-1 text-sm text-rose-500">E-mail inválido.</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {!password || password.length >= 6 ? null : (
                <p className="mt-1 text-sm text-rose-500">
                  Mínimo de 6 caracteres.
                </p>
              )}
            </div>

            

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!valid || loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>

          
            
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;