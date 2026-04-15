type Props = {
  sessionEmail?: string
  roleLabel?: string
  onLogout: () => void
}

export function Navbar({ sessionEmail, roleLabel, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-violet-600">RISKVERIFY</p>
          <p className="text-xs text-slate-500">Verificacion ciudadana de riesgo</p>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <a href="#buscar" className="hover:text-slate-900">Buscar</a>
          <a href="#reportar" className="hover:text-slate-900">Reportar</a>
          <a href="#moderacion" className="hover:text-slate-900">Moderacion</a>
        </nav>
        {sessionEmail ? (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-medium text-slate-800">{sessionEmail}</p>
              <p className="text-xs uppercase tracking-wide text-violet-600">{roleLabel}</p>
            </div>
            <button className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50" onClick={onLogout}>
              Salir
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Ingreso seguro con JWT
          </span>
        )}
      </div>
    </header>
  )
}
