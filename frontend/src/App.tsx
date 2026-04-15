import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api, setAuthToken } from './lib/api'
import { normalizePlate, normalizeRut } from './utils/normalize'

type Role = 'USER' | 'ADMIN'
type ReportType = 'SCAM' | 'STOLEN_VEHICLE'
type ReportStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

type Evidence = {
  id: number
  type: 'TEXT' | 'IMAGE'
  text: string | null
  url: string | null
}

type Report = {
  id: number
  type: ReportType
  name: string | null
  rut: string | null
  plate: string | null
  description: string
  status: ReportStatus
  createdAt: string
  moderationNote: string | null
  evidence: Evidence[]
}

const DISCLAIMER =
  'La informacion publicada es de caracter referencial y debe ser verificada por el usuario. La plataforma no se responsabiliza por el uso indebido de los datos.'

function getStoredSession() {
  const raw = localStorage.getItem('ciudadano-session')
  if (!raw) return null

  try {
    return JSON.parse(raw) as { token: string; email: string; role: Role }
  } catch {
    return null
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'report' | 'admin'>('search')
  const [session, setSession] = useState(getStoredSession)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Report[]>([])
  const [searchMessage, setSearchMessage] = useState('')
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [pendingReports, setPendingReports] = useState<Report[]>([])
  const [adminMessage, setAdminMessage] = useState('')

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [reportType, setReportType] = useState<ReportType>('SCAM')
  const [reportName, setReportName] = useState('')
  const [reportRut, setReportRut] = useState('')
  const [reportPlate, setReportPlate] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [evidenceText, setEvidenceText] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    if (session?.token) {
      setAuthToken(session.token)
    }
  }, [session])

  useEffect(() => {
    if (session) {
      localStorage.setItem('ciudadano-session', JSON.stringify(session))
    } else {
      localStorage.removeItem('ciudadano-session')
    }
  }, [session])

  const isAdmin = session?.role === 'ADMIN'

  const normalizedSearch = useMemo(() => {
    const rut = normalizeRut(search)
    const plate = normalizePlate(search)
    return {
      rut: rut.ok ? rut.value : null,
      plate: plate.ok ? plate.value : null,
    }
  }, [search])

  async function runSearch(event?: FormEvent) {
    event?.preventDefault()
    setIsLoadingSearch(true)
    setSearchMessage('')

    try {
      const response = await api.get('/reports/search', {
        params: { q: search },
      })
      const items = (response.data.items || []) as Report[]
      setSearchResults(items)
      setSearchMessage(items.length ? '' : 'No hay coincidencias verificadas para esa busqueda.')
    } catch (error: any) {
      setSearchMessage(error.response?.data?.error || 'No se pudo realizar la busqueda.')
    } finally {
      setIsLoadingSearch(false)
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
      setReportMessage('Debes aceptar el disclaimer legal para enviar un reporte.')
      return
    }

    if (!session?.token) {
      setReportMessage('Debes iniciar sesion para enviar reportes.')
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

    const evidence = [] as Array<{ type: 'TEXT' | 'IMAGE'; value: string }>
    if (evidenceText.trim()) evidence.push({ type: 'TEXT', value: evidenceText.trim() })
    if (evidenceUrl.trim()) evidence.push({ type: 'IMAGE', value: evidenceUrl.trim() })

    setIsSubmittingReport(true)
    try {
      await api.post('/reports', {
        type: reportType,
        name: reportName,
        rut: normalizedRut.value || '',
        plate: normalizedPlate.value || '',
        description: reportDescription,
        legalAccepted: true,
        evidence,
      })

      setReportMessage('Reporte recibido. Quedara en estado pendiente hasta revision de moderacion.')
      setReportName('')
      setReportRut('')
      setReportPlate('')
      setReportDescription('')
      setEvidenceText('')
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
      setAdminMessage('Necesitas permisos de administrador.')
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

  async function moderateReport(id: number, action: 'APPROVE' | 'REJECT') {
    try {
      await api.patch(`/admin/reports/${id}/moderate`, { action })
      setPendingReports((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      setAdminMessage(error.response?.data?.error || 'No fue posible actualizar el reporte.')
    }
  }

  async function deleteReport(id: number) {
    try {
      await api.delete(`/admin/reports/${id}`)
      setPendingReports((prev) => prev.filter((item) => item.id !== id))
    } catch (error: any) {
      setAdminMessage(error.response?.data?.error || 'No fue posible eliminar el reporte.')
    }
  }

  function logout() {
    setSession(null)
    setAuthEmail('')
    setAuthPassword('')
    setAuthError('')
    setPendingReports([])
    setAuthToken(null)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f6f3eb,_#e9ece6_45%,_#d9dfd2)] text-slate-900">
      <header className="mx-auto max-w-6xl px-4 pb-4 pt-6 md:px-6">
        <div className="rounded-3xl border border-amber-700/20 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-md backdrop-blur">
          <p className="font-medium">Aviso legal obligatorio</p>
          <p>{DISCLAIMER}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">Radar Ciudadano</h1>
            <p className="mt-2 max-w-xl text-slate-700">
              Plataforma de reportes ciudadanos sobre posibles estafas y vehiculos robados, con
              publicacion solo tras revision de moderacion.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/10 bg-white/70 p-4 shadow-sm">
            {session ? (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-700">Sesion activa</p>
                <p>{session.email}</p>
                <p className="text-xs uppercase tracking-wide text-emerald-700">Rol: {session.role}</p>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                  onClick={logout}
                >
                  Cerrar sesion
                </button>
              </div>
            ) : (
              <form className="space-y-2" onSubmit={submitAuth}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1 text-sm ${authMode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}
                    onClick={() => setAuthMode('login')}
                  >
                    Iniciar sesion
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg px-3 py-1 text-sm ${authMode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}
                    onClick={() => setAuthMode('register')}
                  >
                    Registrarse
                  </button>
                </div>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="correo@ejemplo.cl"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Contrasena"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
                <button className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                  {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
                </button>
                {authError && <p className="text-sm text-red-700">{authError}</p>}
              </form>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm ${activeTab === 'search' ? 'bg-slate-900 text-white' : 'bg-white/70'}`}
            onClick={() => setActiveTab('search')}
          >
            Buscador
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${activeTab === 'report' ? 'bg-slate-900 text-white' : 'bg-white/70'}`}
            onClick={() => setActiveTab('report')}
          >
            Registrar reporte
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${activeTab === 'admin' ? 'bg-slate-900 text-white' : 'bg-white/70'}`}
            onClick={() => setActiveTab('admin')}
          >
            Moderacion admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
        {activeTab === 'search' && (
          <section className="rounded-3xl border border-slate-700/10 bg-white/70 p-5 shadow-lg backdrop-blur md:p-8">
            <h2 className="font-display text-2xl">Buscador principal</h2>
            <p className="mt-2 text-sm text-slate-700">
              Busca por nombre, RUT o patente. El sistema normaliza tu entrada antes de consultar.
            </p>

            <form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={runSearch}>
              <input
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
                placeholder="Ej: 12.345.678-k, AB12CD, nombre"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-600">
                {isLoadingSearch ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            <div className="mt-3 text-xs text-slate-600">
              <p>RUT detectado: {normalizedSearch.rut || 'No valido'}</p>
              <p>Patente detectada: {normalizedSearch.plate || 'No valida'}</p>
            </div>

            {searchMessage && <p className="mt-4 text-sm text-amber-700">{searchMessage}</p>}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {searchResults.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      {item.type === 'SCAM' ? 'Estafa' : 'Vehiculo robado'}
                    </p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {item.status === 'VERIFIED' ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-800">{item.description}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Fecha: {new Date(item.createdAt).toLocaleDateString('es-CL')}
                  </p>
                  <p className="text-xs text-slate-500">Nombre: {item.name || 'No informado'}</p>
                  <p className="text-xs text-slate-500">RUT: {item.rut || 'No informado'}</p>
                  <p className="text-xs text-slate-500">Patente: {item.plate || 'No informada'}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'report' && (
          <section className="rounded-3xl border border-slate-700/10 bg-white/70 p-5 shadow-lg backdrop-blur md:p-8">
            <h2 className="font-display text-2xl">Registro de reportes</h2>
            <p className="mt-2 text-sm text-slate-700">
              Todos los reportes quedan en estado pendiente hasta ser aprobados por moderacion.
            </p>

            <form className="mt-5 grid gap-4" onSubmit={submitReport}>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="SCAM">Estafador</option>
                <option value="STOLEN_VEHICLE">Vehiculo robado</option>
              </select>

              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Nombre (opcional)"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="RUT (opcional)"
                  value={reportRut}
                  onChange={(e) => setReportRut(e.target.value)}
                />
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="Patente (opcional)"
                  value={reportPlate}
                  onChange={(e) => setReportPlate(e.target.value)}
                />
              </div>

              <textarea
                className="min-h-36 rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Descripcion detallada del hecho"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />

              <textarea
                className="min-h-20 rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Evidencia textual (opcional)"
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
              />

              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                placeholder="URL de imagen de evidencia (opcional)"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
              />

              <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={acceptedDisclaimer}
                  onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                  className="mt-1"
                />
                <span>Declaro haber leido y aceptado el disclaimer legal antes de enviar este reporte.</span>
              </label>

              <button
                className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? 'Enviando...' : 'Enviar a moderacion'}
              </button>

              {reportMessage && <p className="text-sm text-indigo-700">{reportMessage}</p>}
            </form>
          </section>
        )}

        {activeTab === 'admin' && (
          <section className="rounded-3xl border border-slate-700/10 bg-white/70 p-5 shadow-lg backdrop-blur md:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Panel de moderacion</h2>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                onClick={loadPendingReports}
              >
                Cargar pendientes
              </button>
            </div>

            {!isAdmin && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                Solo un administrador autenticado puede aprobar, rechazar o eliminar reportes.
              </p>
            )}

            {adminMessage && <p className="mt-3 text-sm text-amber-700">{adminMessage}</p>}

            <div className="mt-5 grid gap-4">
              {pendingReports.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-rose-700">Pendiente #{item.id}</p>
                  <p className="mt-2 text-sm">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.type === 'SCAM' ? 'Estafa' : 'Vehiculo robado'} | RUT: {item.rut || 'N/A'} |
                    Patente: {item.plate || 'N/A'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500"
                      onClick={() => moderateReport(item.id, 'APPROVE')}
                    >
                      Aprobar
                    </button>
                    <button
                      className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-500"
                      onClick={() => moderateReport(item.id, 'REJECT')}
                    >
                      Rechazar
                    </button>
                    <button
                      className="rounded-lg bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-600"
                      onClick={() => deleteReport(item.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
