import pb from '@/lib/pocketbase/client'
import { ServiceOrder, User, ServiceOrderPhoto, ServiceFeedback } from '@/types'
import { getEmpresaFilter } from '@/lib/pocketbase/auth-filter'

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const filter = getEmpresaFilter()
  return pb.collection('service_orders').getFullList<ServiceOrder>({
    filter,
    sort: '-created',
    expand: 'technician,customer',
  })
}

export async function getServiceOrder(id: string): Promise<ServiceOrder> {
  return pb.collection('service_orders').getOne<ServiceOrder>(id, {
    expand: 'technician,customer',
  })
}

export async function updateOrderStatus(id: string, status: string): Promise<ServiceOrder> {
  return pb.collection('service_orders').update<ServiceOrder>(id, { status })
}

export async function updateOrder(id: string, data: Partial<ServiceOrder>): Promise<ServiceOrder> {
  return pb.collection('service_orders').update<ServiceOrder>(id, data)
}

export async function deleteOrder(id: string): Promise<void> {
  return pb.collection('service_orders').delete(id)
}

export async function getTechnicians(): Promise<User[]> {
  let filter = `tipo_role = "tecnico"`
  const empFilter = getEmpresaFilter()
  if (empFilter) {
    filter += ` && ${empFilter}`
  }

  return pb.collection('users').getFullList<User>({
    filter,
    sort: 'name',
  })
}

export async function getOrderPhotos(orderId: string): Promise<ServiceOrderPhoto[]> {
  return pb.collection('service_order_photos').getFullList<ServiceOrderPhoto>({
    filter: `service_order = "${orderId}"`,
    sort: '-created',
  })
}

export async function getAllPhotos(): Promise<ServiceOrderPhoto[]> {
  return pb.collection('service_order_photos').getFullList<ServiceOrderPhoto>({
    sort: '-created',
  })
}

export async function getServiceFeedbacks(): Promise<ServiceFeedback[]> {
  return pb.collection('service_feedback').getFullList<ServiceFeedback>({
    sort: '-created',
    expand: 'service_order',
  })
}
