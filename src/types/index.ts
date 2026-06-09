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
  region?: string
  certifications?: string
  status?: 'active' | 'inactive'
}

export type PaymentStatus = 'pago' | 'pendente' | 'vencido'

export interface ServiceOrder {
  id: string
  customer_name: string
  final_value?: number
  payment_status?: PaymentStatus
  payment_link?: string
  planned_margin?: number
  actual_margin?: number
  payment_proof?: string
  customer_delays_count?: number
  service_type: string
  urgency: Urgency
  sla_deadline: string
  technician: string
  scheduled_date: string
  region: string
  status: OrderStatus
  has_pending_checklist: boolean
  description: string
  diagnosis?: string
  activities_performed?: string
  current_condition?: string
  recommendations?: string
  created: string
  updated: string
  predicted_duration_hours?: number
  estimated_travel_hours?: number
  lat?: number
  lng?: number
  operational_status?: OperationalStatus
  last_paused_at?: string
  started_at?: string
  finished_at?: string
  total_pause_time_minutes?: number
  materials_used?: string
  technical_observations?: string
  signature?: string
  is_rework?: boolean
  total_distance_km?: number
  actual_duration_hours?: number
  is_recurring?: boolean
  origin?: string
  category?: string
  estimated_materials?: string
  suggested_price?: number
  displacement_min?: number
  technical_report?: string
  recurrence_config?: string
  expand?: {
    technician?: User
  }
}

export type OperationalStatus = 'pending' | 'en_route' | 'in_progress' | 'paused' | 'completed'

export interface ServiceFeedback {
  id: string
  service_order: string
  nps_score: number
  complaint_description?: string
  created: string
  updated: string
  expand?: {
    service_order?: ServiceOrder
  }
}

export interface ServiceOrderPhoto {
  id: string
  service_order: string
  file: string
  stage: 'before' | 'after'
  created: string
  updated: string
}

export interface ServiceOrderChecklistItem {
  id: string
  service_order: string
  task_description: string
  is_completed: boolean
  created: string
  updated: string
}
