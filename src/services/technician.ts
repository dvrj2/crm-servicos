import pb from '@/lib/pocketbase/client'

export const getTechnicianOS = async (technicianId: string) => {
  return pb.collection('service_orders').getFullList({
    filter: `technician = "${technicianId}"`,
    expand: 'customer',
    sort: 'scheduled_date',
  })
}

export const getOSChecklist = async (osId: string) => {
  return pb.collection('service_order_checklist_items').getFullList({
    filter: `service_order = "${osId}"`,
  })
}

export const toggleChecklistItem = async (itemId: string, is_completed: boolean) => {
  return pb.collection('service_order_checklist_items').update(itemId, { is_completed })
}

export const getOSPhotos = async (osId: string) => {
  return pb.collection('service_order_photos').getFullList({
    filter: `service_order = "${osId}"`,
    sort: '-created',
  })
}

export const uploadOSPhoto = async (osId: string, file: File, stage: 'before' | 'after') => {
  const formData = new FormData()
  formData.append('service_order', osId)
  formData.append('file', file)
  formData.append('stage', stage)
  return pb.collection('service_order_photos').create(formData)
}

export const deleteOSPhoto = async (photoId: string) => {
  return pb.collection('service_order_photos').delete(photoId)
}

export const updateOSStatus = async (osId: string, data: Record<string, any>) => {
  return pb.collection('service_orders').update(osId, data)
}

export const uploadSignature = async (osId: string, file: File) => {
  const formData = new FormData()
  formData.append('signature', file)
  return pb.collection('service_orders').update(osId, formData)
}
