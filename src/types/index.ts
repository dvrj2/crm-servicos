export type Urgency = 'baixa' | 'media' | 'alta'
export type OrderStatus =
  | 'novo'
  | 'qualificado'
  | 'orcamento'
  | 'aprovado'
  | 'agendado'
  | 'execucao'
  | 'concluido'
  | 'faturado'

export interface User {
  id: string
  name: string
  avatar: string
  email: string
  capacity_diaria_hours?: number
  current_lat?: number
  current_lng?: number
}

export interface ServiceOrder {
  id: string
  customer_name: string
  service_type: string
  urgency: Urgency
  sla_deadline: string
  technician: string
  scheduled_date: string
  region: string
  status: OrderStatus
  has_pending_checklist: boolean
  description: string
  created: string
  updated: string
  predicted_duration_hours?: number
  estimated_travel_hours?: number
  lat?: number
  lng?: number
  expand?: {
    technician?: User
  }
}
