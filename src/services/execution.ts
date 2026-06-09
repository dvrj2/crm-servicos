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

export const ensureAppointment = async (orderId: string, technicianId: string) => {
  try {
    return await pb
      .collection('appointments')
      .getFirstListItem(`quote.service_order = "${orderId}"`)
  } catch {
    try {
      const quote = await pb.collection('quotes').getFirstListItem(`service_order = "${orderId}"`)
      return await pb.collection('appointments').create({
        quote: quote.id,
        technician: technicianId,
        start_time: new Date().toISOString(),
        operation_status: 'pendente',
      })
    } catch {
      return await pb.collection('appointments').create({
        technician: technicianId,
        start_time: new Date().toISOString(),
        operation_status: 'pendente',
      })
    }
  }
}

export const getExecutionForAppointment = async (appId: string) => {
  try {
    return await pb.collection('executions').getFirstListItem(`appointment = "${appId}"`)
  } catch {
    return null
  }
}

export const getExecutionByOrderId = async (orderId: string) => {
  try {
    const quote = await pb.collection('quotes').getFirstListItem(`service_order = "${orderId}"`)
    const appt = await pb.collection('appointments').getFirstListItem(`quote = "${quote.id}"`)
    return await pb.collection('executions').getFirstListItem(`appointment = "${appt.id}"`)
  } catch {
    return null
  }
}

export const generateAIReport = async (
  description: string,
  technical_notes: string,
  checklist: string,
) => {
  const res = await pb.send('/backend/v1/generate-report', {
    method: 'POST',
    body: JSON.stringify({ description, technical_notes, checklist }),
  })
  return res.report
}

export const createExecution = async (data: FormData | Record<string, any>) => {
  return await pb.collection('executions').create(data)
}

export const updateExecution = async (id: string, data: FormData | Record<string, any>) => {
  return await pb.collection('executions').update(id, data)
}
