export type Urgency = 'baixa' | 'média' | 'crítica'
export type OrderStatus =
  | 'novo'
  | 'qualificado'
  | 'orçamento'
  | 'aprovado'
  | 'agendado'
  | 'executando'
  | 'concluído'

export interface Customer {
  id: string
  name: string
  phone?: string
  address?: string
  lat?: number
  lng?: number
  tipo_cliente?: 'residencial' | 'comercial' | 'industrial'
  created: string
  updated: string
}

export interface ServiceOrderMessage {
  id: string
  service_order: string
  sender: string
  message: string
  created: string
  updated: string
  expand?: {
    sender?: User
  }
}

export interface User {
  id: string
  name: string
  avatar: string
  email: string
  capacity_diaria_hours?: number
  occupancy_current_hours?: number
  current_lat?: number
  current_lng?: number
  region?: string
  certifications?: string
  status?: 'disponível' | 'em rota' | 'ocupado'
  operational_status?: 'available' | 'en_route' | 'busy'
}

export type PaymentStatus = 'pago' | 'pendente' | 'vencido'

export interface Quote {
  id: string
  service_order: string
  estimated_hours?: number
  materials?: any
  estimated_cost?: number
  suggested_margin?: number
  status?: string
  created: string
  updated: string
  suggested_price?: number
  observations?: string
}

export interface Appointment {
  id: string
  quote?: string
  technician: string
  start_time: string
  predicted_duration?: number
  travel_time_min?: number
  operation_status?: string
  created: string
  updated: string
}

export interface ServiceOrder {
  id: string
  _apptId?: string
  _quoteId?: string
  customer_name: string
  sla_deadline_minutes?: number
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
  origin?: 'whatsapp' | 'site' | 'outros'
  customer?: string
  category?: string
  estimated_materials?: string
  suggested_price?: number
  displacement_min?: number
  technical_report?: string
  recurrence_config?: string
  expand?: {
    technician?: User
    customer?: Customer
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
