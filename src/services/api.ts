import pb from '@/lib/pocketbase/client'
import { ServiceOrder, User } from '@/types'

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  return (await pb.collection('service_orders').getFullList({
    expand: 'technician',
    sort: 'sla_deadline',
  })) as ServiceOrder[]
}

export const updateOrderStatus = async (id: string, status: string): Promise<ServiceOrder> => {
  return (await pb.collection('service_orders').update(id, { status })) as ServiceOrder
}

export const updateOrder = async (
  id: string,
  data: Partial<ServiceOrder>,
): Promise<ServiceOrder> => {
  return (await pb.collection('service_orders').update(id, data)) as ServiceOrder
}

export const deleteOrder = async (id: string): Promise<void> => {
  await pb.collection('service_orders').delete(id)
}

export const getTechnicians = async (): Promise<User[]> => {
  return (await pb.collection('users').getFullList()) as User[]
}
