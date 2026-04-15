import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navbar } from './components/Navbar'
import { ResultCard } from './components/ResultCard'
import { StatusBadge } from './components/StatusBadge'
import { api, setAuthToken } from './lib/api'
import type { Report, ReportType, Session } from './types'
import { normalizePlate, normalizeRut } from './utils/normalize'

const DISCLAIMER =
  'Esta plataforma muestra reportes generados por usuarios. La informacion debe ser verificada antes de tomar decisiones.'

function getStoredSession(): Session | null {
  const raw = localStorage.getItem('riskverify-session')
  if (!raw) return null

  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(getStoredSession)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [searchResults, setSearchResults] = useState<Report[]>([])
  const [searchMessage, setSearchMessage] = useState('')
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [detailMessage, setDetailMessage] = useState('')

  const [reportType, setReportType] = useState<ReportType>('SCAM')
  const [reportName, setReportName] = useState('')
  const [reportRut, setReportRut] = useState('')
  const [reportPlate, setReportPlate] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const [pendingReports, setPendingReports] = useState<Report[]>([])
  const [adminMessage, setAdminMessage] = useState('')

  const isAdmin = session?.role === 'ADMIN'

  useEffect(() => {
    setAuthToken(session?.token || null)
  }, [session])

  useEffect(() => {
    if (session) {
      localStorage.setItem('riskverify-session', JSON.stringify(session))
      return
    }

    localStorage.removeItem('riskverify-session')
  }, [session])

  const normalizedSearch = useMemo(() => {
    const rut = normalizeRut(search)
    const plate = normalizePlate(search)
    return {
      rut: rut.ok ? rut.value : null,
      plate: plate.ok ? plate.value : null,
    }
  }, [search])

  useEffect(() => {
    const query = deferredSearch.trim()

    if (!query) {
      setSearchResults([])
      setSearchMessage('')
      setSelectedReport(null)
      setDetailMessage('')
      return
    }

    const timer = window.setTimeout(() => {
      void runSearch(query)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [deferredSearch])

  async function runSearch(query: string) {
    setIsLoadingSearch(true)
    setDetailMessage('')

    try {
      const response = await api.get('/search', { params: { q: query } })
      const items = (response.data.items || []) as Report[]

      startTransition(() => {
        setSearchResults(items)
        setSearchMessage(items.length ? 'Este registro ha sido reportado.' : 'No hay reportes.')
      })

      if (items[0]) {
        void loadReportDetail(items[0].id)
      } else {
        setSelectedReport(null)
      }
    } catch (error: any) {
      setSearchMessage(error.response?.data?.error || 'No se pudo realizar la busqueda.')
      setSearchResults([])
      setSelectedReport(null)
    } finally {
      setIsLoadingSearch(false)
    }
  }

  async function loadReportDetail(reportId: number) {
    try {
      const response = await api.get(`/reports/${reportId}`)
      setSelectedReport(response.data.item || null)
      setDetailMessage('')
    } catch (error: any) {
      setDetailMessage(error.response?.data?.error || 'No fue posible cargar el detalle.')
    }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault()
    setAuthError('')

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const response = await api.post(endpoint, {
        email: authEmail,
        password: authPassword,
      })

      setSession({
        token: response.data.token,
        email: response.data.user.email,
        role: response.data.user.role,
      })
    } catch (error: any) {
      setAuthError(error.response?.data?.error || 'No fue posible autenticarte.')
    }
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault()
    setReportMessage('')

    if (!acceptedDisclaimer) {
      setReportMessage('Debes aceptar el disclaimer legal para enviar el reporte.')
      return
    }

    if (!session?.token) {
      setReportMessage('Debes iniciar sesion para crear reportes.')
      return
    }

    const normalizedRut = reportRut ? normalizeRut(reportRut) : { ok: true, value: '' }
    const normalizedPlate = reportPlate ? normalizePlate(reportPlate) : { ok: true, value: '' }

    if (reportRut && !normalizedRut.ok) {
      setReportMessage('El RUT ingresado no es valido.')
      return
    }

    if (reportPlate && !normalizedPlate.ok) {
      setReportMessage('La patente ingresada no tiene formato chileno valido.')
      return
    }

    setIsSubmittingReport(true)

    try {
      await api.post('/reports', {
        type: reportType,
        name: reportName,
        rut: normalizedRut.value || '',
        plate: normalizedPlate.value || '',
        description: reportDescription,
        legalAccepted: true,
        evidence: evidenceUrl.trim() ? [{ type: 'IMAGE', value: evidenceUrl.trim() }] : [],
      })

      setReportMessage('Reporte enviado. Quedo en estado pendiente hasta revision de un administrador.')
      setReportName('')
      setReportRut('')
      setReportPlate('')
      setReportDescription('')
      setEvidenceUrl('')
      setAcceptedDisclaimer(false)
    } catch (error: any) {
      setReportMessage(error.response?.data?.error || 'No se pudo guardar el reporte.')
    } finally {
      setIsSubmittingReport(false)
    }
  }

  async function loadPendingReports() {
    if (!isAdmin) {
      setAdminMessage('Solo un administrador puede revisar reportes pendientes.')
      return
    }

    try {
      const response = await api.get('/admin/reports/pending')
      setPendingReports(response.data.items || [])
      setAdminMessage('')
    } catch (error: any) {
      setAdminMessage(error.response?.data?.error || 'No se pudieron cargar los pendientes.')
    }
  }

  async function moderateReport(reportId: number, action: 'APPROVE' | 'REJECT') {
    try {
      await api.patch(`/reports/${reportId}`, { action })
      setPendingReports((current) => current.filter((item) => item.id !== reportId))
    } catch (error: any) {
      setAdminMessage(error.response?.data?.error || 'No fue posible actualizar el estado.')
    }
  }

  async function deleteReport(reportId: number) {
    try {
      await api.delete(`/admin/reports/${reportId}`)
      setPendingReports((current) => current.filter((item) => item.id !== reportId))
    } catch (error: any) {
      setAdminMessage(error.response?.data?.error || 'No fue posible eliminar el reporte.')
    }
  }

  function logout() {
    setSession(null)
    setPendingReports([])
    setAuthEmail('')
    setAuthPassword('')
    setAuthError('')
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900">
      <Navbar sessionEmail={session?.email} roleLabel={session?.role} onLogout={logout} />

      <main className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <section className="grid gap-8 pb-14 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:px-10">
            <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-violet-200/50 blur-3xl" />
            <p className="relative text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">
              Verificacion de riesgo en segundos
            </p>
            <h1 className="relative mt-4 max-w-2xl font-display text-5xl leading-tight text-slate-950 md:text-6xl">
              Verifica antes de transferir
            </h1>
            <p className="relative mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Consulta nombres, RUT o patentes normalizadas para detectar posibles estafas y
              vehiculos reportados antes de tomar una decision.
            </p>

            <div id="buscar" className="relative mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  className="h-16 flex-1 rounded-[1.2rem] border border-slate-200 bg-white px-5 text-lg outline-none ring-0 placeholder:text-slate-400 focus:border-violet-400"
                  placeholder="Busca por nombre, RUT o patente"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => void runSearch(search.trim())}
                  className="h-16 rounded-[1.2rem] bg-violet-600 px-8 text-base font-semibold text-white transition hover:bg-violet-500"
                >
                  {isLoadingSearch ? 'Buscando...' : 'Verificar ahora'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>RUT detectado: {normalizedSearch.rut || 'No valido'}</span>
                <span>Patente detectada: {normalizedSearch.plate || 'No valida'}</span>
              </div>
            </div>

            <div className="relative mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-4 py-2">Busqueda instantanea</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">Moderacion previa</span>
              <span className="rounded-full bg-slate-100 px-4 py-2">PostgreSQL portable</span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Aviso legal</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{DISCLAIMER}</p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Acceso</p>
              <form className="mt-4 space-y-3" onSubmit={submitAuth}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`rounded-xl px-4 py-2 text-sm ${authMode === 'login' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Iniciar sesion
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`rounded-xl px-4 py-2 text-sm ${authMode === 'register' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Crear cuenta
                  </button>
                </div>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="correo@empresa.cl"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3"
                  placeholder="Contrasena segura"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
                <button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800">
                  {authMode === 'login' ? 'Entrar al panel' : 'Registrarme'}
                </button>
                {authError && <p className="text-sm text-rose-700">{authError}</p>}
              </form>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl text-slate-950">Resultados</h2>
                <p className="mt-2 text-sm text-slate-500">Consulta en tiempo real sobre registros aprobados.</p>
              </div>
              {search.trim() ? (
                searchResults.length > 0 ? <StatusBadge status="APPROVED" /> : <StatusBadge status="CLEAR" />
              ) : null}
            </div>

            {search.trim() && (
              <div className={`rounded-3xl border p-5 ${searchResults.length ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <p className="text-sm font-semibold text-slate-900">{searchMessage || 'Escribe un termino para buscar.'}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {searchResults.length
                    ? 'Revisa los detalles antes de transferir dinero o concretar una compra.'
                    : 'No se encontraron coincidencias aprobadas para este registro.'}
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {searchResults.map((report) => (
                <ResultCard key={report.id} report={report} onSelect={(id) => void loadReportDetail(id)} />
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Detalle del reporte</p>
            {selectedReport ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">
                      {selectedReport.name || selectedReport.rut || selectedReport.plate || `Reporte #${selectedReport.id}`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedReport.type === 'SCAM' ? 'Posible estafa' : 'Vehiculo reportado'}
                    </p>
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <p className="text-sm leading-7 text-slate-600">{selectedReport.description}</p>
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p>RUT normalizado: {selectedReport.rut || 'No informado'}</p>
                  <p>Patente normalizada: {selectedReport.plate || 'No informada'}</p>
                  <p>Fecha: {new Date(selectedReport.createdAt).toLocaleDateString('es-CL')}</p>
                </div>
                {selectedReport.evidence.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Evidencia</p>
                    <div className="mt-3 space-y-2 text-sm text-violet-700">
                      {selectedReport.evidence.map((item) => (
                        <a key={item.id} href={item.url || '#'} target="_blank" rel="noreferrer" className="block rounded-xl bg-violet-50 px-4 py-3 hover:bg-violet-100">
                          {item.url || item.text || 'Evidencia adjunta'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-3xl bg-slate-50 p-6 text-sm leading-7 text-slate-500">
                {detailMessage || 'Selecciona un resultado para revisar mas contexto.'}
              </div>
            )}
          </aside>
        </section>

        <section id="reportar" className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
            <h2 className="font-display text-3xl text-slate-950">Crear reporte</h2>
            <p className="mt-2 text-sm text-slate-500">
              Todo reporte entra como pendiente y requiere revision manual antes de hacerse visible.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={submitReport}>
              <select
                className="rounded-2xl border border-slate-200 px-4 py-3"
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
              >
                <option value="SCAM">Posible estafador</option>
                <option value="VEHICLE">Vehiculo robado</option>
              </select>
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Nombre o alias"
                value={reportName}
                onChange={(event) => setReportName(event.target.value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="RUT"
                  value={reportRut}
                  onChange={(event) => setReportRut(event.target.value)}
                />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  placeholder="Patente"
                  value={reportPlate}
                  onChange={(event) => setReportPlate(event.target.value)}
                />
              </div>
              <textarea
                className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Describe por que este registro representa un riesgo"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
              />
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="URL de evidencia"
                value={evidenceUrl}
                onChange={(event) => setEvidenceUrl(event.target.value)}
              />
              <label className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedDisclaimer}
                  onChange={(event) => setAcceptedDisclaimer(event.target.checked)}
                />
                <span>{DISCLAIMER}</span>
              </label>
              <button
                className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? 'Enviando...' : 'Enviar a revision'}
              </button>
              {reportMessage && <p className="text-sm text-slate-600">{reportMessage}</p>}
            </form>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Por que esta preparado para crecer</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>Frontend y backend separados en carpetas independientes.</li>
                <li>Prisma usa solo `DATABASE_URL`, por lo que salir de Railway no requiere refactor.</li>
                <li>Funciones de normalizacion reutilizables para RUT y patente.</li>
                <li>API modular con controladores, middlewares y validacion centralizada.</li>
              </ul>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-violet-600 to-blue-600 p-6 text-white shadow-[0_20px_60px_rgba(79,70,229,0.32)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-100">Estado del sistema</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-3xl font-semibold">JWT</p>
                  <p className="text-sm text-violet-100">Sesion segura</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">Prisma</p>
                  <p className="text-sm text-violet-100">Migraciones controladas</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">Railway</p>
                  <p className="text-sm text-violet-100">Solo como host inicial</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="moderacion" className="mt-14 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-3xl text-slate-950">Moderacion admin</h2>
              <p className="mt-2 text-sm text-slate-500">Aprueba o rechaza reportes antes de publicarlos.</p>
            </div>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white hover:bg-slate-800" onClick={() => void loadPendingReports()}>
              Cargar pendientes
            </button>
          </div>

          {!isAdmin && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Debes iniciar sesion como administrador para usar este panel.
            </div>
          )}

          {adminMessage && <p className="mt-5 text-sm text-slate-600">{adminMessage}</p>}

          <div className="mt-6 grid gap-4">
            {pendingReports.map((report) => (
              <article key={report.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600">Pendiente</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {report.name || report.rut || report.plate || `Reporte #${report.id}`}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{report.description}</p>
                  </div>
                  <StatusBadge status="PENDING" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500" onClick={() => void moderateReport(report.id, 'APPROVE')}>
                    Aprobar
                  </button>
                  <button className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-400" onClick={() => void moderateReport(report.id, 'REJECT')}>
                    Rechazar
                  </button>
                  <button className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500" onClick={() => void deleteReport(report.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
