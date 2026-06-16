import pb from '@/lib/pocketbase/client'
import { SystemSetting } from '@/types'

export const getSettings = () => pb.collection('system_settings').getFullList<SystemSetting>()
export const saveSetting = async (key: string, value: any) => {
  try {
    const existing = await pb.collection('system_settings').getFirstListItem(`key="${key}"`)
    return pb.collection('system_settings').update(existing.id, { value })
  } catch {
    return pb.collection('system_settings').create({ key, value })
  }
}
