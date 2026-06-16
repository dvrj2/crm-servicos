import { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export function useSandbox() {
  const [isSandbox, setIsSandbox] = useState(false)
  const [settingId, setSettingId] = useState<string | null>(null)

  useEffect(() => {
    pb.collection('system_settings')
      .getFirstListItem('key="sandbox_mode"')
      .then((record) => {
        setIsSandbox(record.value?.enabled === true)
        setSettingId(record.id)
      })
      .catch(() => {})
  }, [])

  useRealtime('system_settings', (e) => {
    if (e.record.key === 'sandbox_mode') {
      setIsSandbox(e.record.value?.enabled === true)
      setSettingId(e.record.id)
    }
  })

  const toggleSandbox = async (enabled: boolean) => {
    if (settingId) {
      await pb.collection('system_settings').update(settingId, {
        value: { enabled },
      })
    } else {
      try {
        const record = await pb.collection('system_settings').create({
          key: 'sandbox_mode',
          value: { enabled },
        })
        setSettingId(record.id)
        setIsSandbox(enabled)
      } catch {
        /* intentionally ignored */
      }
    }
  }

  return { isSandbox, toggleSandbox }
}
