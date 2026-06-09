import pb from '@/lib/pocketbase/client'
import { ServiceOrder, ServiceOrderMessage, ServiceOrderPhoto } from '@/types'

export const getOrderDetails = async (id: string): Promise<ServiceOrder> => {
  return pb.collection('service_orders').getOne(id, {
    expand: 'technician,customer',
  }) as Promise<ServiceOrder>
}

export const getOrderBeforePhotos = async (orderId: string): Promise<ServiceOrderPhoto[]> => {
  return pb.collection('service_order_photos').getFullList({
    filter: `service_order = "${orderId}" && stage = 'before'`,
  }) as Promise<ServiceOrderPhoto[]>
}

export const getOrderMessages = async (orderId: string): Promise<ServiceOrderMessage[]> => {
  return pb.collection('service_order_messages').getFullList({
    filter: `service_order = "${orderId}"`,
    sort: 'created',
    expand: 'sender',
  }) as Promise<ServiceOrderMessage[]>
}

export const createOrderMessage = async (data: {
  service_order: string
  sender: string
  message: string
}) => {
  return pb.collection('service_order_messages').create(data)
}

export const getCustomerHistory = async (
  customerId: string,
  excludeOrderId: string,
): Promise<ServiceOrder[]> => {
  return pb
    .collection('service_orders')
    .getList(1, 5, {
      filter: `customer = "${customerId}" && id != "${excludeOrderId}"`,
      sort: '-created',
    })
    .then((res) => res.items as ServiceOrder[])
}

export const getQuoteByOrderId = async (orderId: string): Promise<any | null> => {
  try {
    const records = await pb.collection('quotes').getFullList({
      filter: `service_order = "${orderId}"`,
      sort: '-created',
      limit: 1,
    })
    return records[0] || null
  } catch {
    return null
  }
}

export const saveQuote = async (data: any): Promise<any> => {
  if (data.id) {
    return pb.collection('quotes').update(data.id, data)
  } else {
    return pb.collection('quotes').create(data)
  }
}
