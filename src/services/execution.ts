import pb from '@/lib/pocketbase/client'
import { ServiceOrderChecklistItem, ServiceOrderPhoto, ServiceOrder } from '@/types'

export const getOrderPhotos = async (orderId: string) => {
  return await pb.collection('service_order_photos').getFullList<ServiceOrderPhoto>({
    filter: `service_order = '${orderId}'`,
  })
}

export const getChecklistItems = async (orderId: string) => {
  return await pb
    .collection('service_order_checklist_items')
    .getFullList<ServiceOrderChecklistItem>({
      filter: `service_order = '${orderId}'`,
    })
}

export const uploadPhoto = async (orderId: string, file: File, stage: 'before' | 'after') => {
  const formData = new FormData()
  formData.append('service_order', orderId)
  formData.append('file', file)
  formData.append('stage', stage)
  return await pb.collection('service_order_photos').create<ServiceOrderPhoto>(formData)
}

export const deletePhoto = async (photoId: string) => {
  await pb.collection('service_order_photos').delete(photoId)
}

export const updateChecklistItem = async (itemId: string, is_completed: boolean) => {
  return await pb
    .collection('service_order_checklist_items')
    .update<ServiceOrderChecklistItem>(itemId, { is_completed })
}

export const updateExecutionOrder = async (
  orderId: string,
  data: Record<string, any> | FormData,
) => {
  return await pb.collection('service_orders').update<ServiceOrder>(orderId, data)
}

export const updateUserLocation = async (userId: string, lat: number, lng: number) => {
  return await pb.collection('users').update(userId, { current_lat: lat, current_lng: lng })
}
