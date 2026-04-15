import type { Report } from '../types'
import { StatusBadge } from './StatusBadge'

type Props = {
  report: Report
  onSelect: (reportId: number) => void
}

export function ResultCard({ report, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(report.id)}
      className="group w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(15,23,42,0.1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600">
            {report.type === 'SCAM' ? 'Posible estafa' : 'Vehiculo robado'}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {report.name || report.rut || report.plate || `Reporte #${report.id}`}
          </h3>
        </div>
        <StatusBadge status={report.status} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{report.description}</p>
      <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>RUT: {report.rut || 'No informado'}</span>
        <span>Patente: {report.plate || 'No informada'}</span>
        <span>{new Date(report.createdAt).toLocaleDateString('es-CL')}</span>
      </div>
      <span className="mt-4 inline-flex text-sm font-medium text-violet-700 group-hover:text-violet-800">
        Ver detalle
      </span>
    </button>
  )
}
