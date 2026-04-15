export type Role = 'USER' | 'ADMIN'
export type ReportType = 'SCAM' | 'VEHICLE'
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type Evidence = {
  id: number
  type: 'TEXT' | 'IMAGE'
  text: string | null
  url: string | null
}

export type Report = {
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

export type Session = {
  token: string
  email: string
  role: Role
}
