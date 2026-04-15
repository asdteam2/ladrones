import type { ReportStatus } from '../types'

type Props = {
  status: ReportStatus | 'CLEAR'
}

const styles: Record<Props['status'], string> = {
  APPROVED: 'bg-rose-50 text-rose-700 ring-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  REJECTED: 'bg-slate-100 text-slate-600 ring-slate-200',
  CLEAR: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const labels: Record<Props['status'], string> = {
  APPROVED: 'Reportado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
  CLEAR: 'Sin reportes',
}

export function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
