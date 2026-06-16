import pb from '@/lib/pocketbase/client'
import type { SimulationLog } from '@/types'

export const getSimulationLogs = async () => {
  return pb.collection<SimulationLog>('simulation_logs').getFullList({
    sort: '-created',
  })
}

export const clearSimulationLogs = async () => {
  return pb.send('/backend/v1/simulation-logs/clear', { method: 'DELETE' })
}
