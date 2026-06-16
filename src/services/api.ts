import pb from '@/lib/pocketbase/client'
import { ServiceOrder, User, ServiceOrderPhoto, ServiceFeedback } from '@/types'
import { getEmpresaFilter, withEmpresaId } from '@/lib/pocketbase/auth-filter'

export const getServiceOrders = async () => {
  return pb.collection('service_orders').getFullList<ServiceOrder>({
    filter: getEmpresaFilter(),
    expand: 'technician,customer',
  })
}

export const getServiceOrder = async (id: string) => {
  return pb.collection('service_orders').getOne<ServiceOrder>(id, { expand: 'technician,customer' })
}

export const updateOrderStatus = async (id: string, status: string) => {
  return pb.collection('service_orders').update<ServiceOrder>(id, { status })
}

export const updateOrder = async (id: string, data: Partial<ServiceOrder>) => {
  return pb.collection('service_orders').update<ServiceOrder>(id, data)
}

export const deleteOrder = async (id: string) => {
  return pb.collection('service_orders').delete(id)
}

export const getTechnicians = async () => {
  return pb.collection('users').getFullList<User>({
    filter: getEmpresaFilter("tipo_role = 'tecnico'"),
  })
}

export const getOrderPhotos = async (orderId: string) => {
  return pb
    .collection('service_order_photos')
    .getFullList<ServiceOrderPhoto>({ filter: `service_order = "${orderId}"` })
}

export const getAllPhotos = async () => {
  return pb.collection('service_order_photos').getFullList<ServiceOrderPhoto>()
}

export const getServiceFeedbacks = async () => {
  return pb.collection('service_feedback').getFullList<ServiceFeedback>({ expand: 'service_order' })
}
